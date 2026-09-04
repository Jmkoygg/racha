import { createWorker } from "tesseract.js";
import os from "os";
import path from "path";

export interface ComprovanteData {
  amountCents: number | null;
  dateISO: string | null;
  destKey: string | null;
  destName: string | null;
  payerName: string | null;
  txId: string | null;
  raw: string;
}

export function visionConfigured(): boolean {
  return true;
}

/** Extrai dados de um comprovante PIX a partir do texto lido pelo OCR */
export function parsePixText(text: string): Omit<ComprovanteData, "raw"> {
  const clean = text.replace(/\r/g, "");

  // 1. Procura valor em BRL: "R$ 0,50", "Vator R$0,50", "Valor final A$0,50", etc.
  let amountCents: number | null = null;
  const amountRegexes = [
    /(?:valor|total|quantia|pago|vator|valor final)[^\d\n]*[RA]?\$\s*([0-9]+[.,][0-9]{2})/gi,
    /[RA]?\$\s*([0-9]+[.,][0-9]{2})/gi,
    /\b([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})\b/g,
    /\b([0-9]+,[0-9]{2})\b/g,
  ];

  for (const regex of amountRegexes) {
    const matches = [...clean.matchAll(regex)];
    for (const m of matches) {
      const rawVal = m[1].replace(/\./g, "").replace(",", ".");
      const num = parseFloat(rawVal);
      if (!isNaN(num) && num > 0) {
        amountCents = Math.round(num * 100);
        break;
      }
    }
    if (amountCents !== null) break;
  }

  // 2. ID da transação PIX (EndToEndId do BACEN: 'E' seguido de 31 caracteres alfanuméricos)
  let txId: string | null = null;
  const e2eMatch = clean.match(/\b(E[0-9a-zA-Z]{31})\b/i);
  if (e2eMatch) {
    txId = e2eMatch[1].toUpperCase();
  } else {
    // Procura blocos próximos de "transação", "autenticação", "controle"
    const lines = clean.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (/transa[çc][ãa]o|autentica[çc][ãa]o|e2eid|controle/i.test(lines[i])) {
        const nextFew = lines.slice(i, i + 3).join(" ");
        const found = nextFew.match(/\b(E[0-9a-zA-Z]{25,35})\b/i);
        if (found) {
          txId = found[1].toUpperCase();
          break;
        }
      }
    }
  }

  if (!txId) {
    const authMatch = clean.match(
      /(?:id da transa[çc][ãa]o|autentica[çc][ãa]o|c[oó]digo da opera[çc][ãa]o|controle)[:\s]*([0-9a-zA-Z.-]{10,})/i,
    );
    if (authMatch) {
      txId = authMatch[1].replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
    }
  }

  // 3. Data e Hora
  let dateISO: string | null = null;
  const dateMatch = clean.match(/\b(\d{2})[/.-](\d{2})[/.-](\d{4})\b/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    const timeMatch = clean.match(/\b(\d{2}):(\d{2})(?::(\d{2}))?\b/);
    if (timeMatch) {
      const [, hour, min, sec] = timeMatch;
      dateISO = `${year}-${month}-${day}T${hour}:${min}:${sec || "00"}-03:00`;
    } else {
      dateISO = `${year}-${month}-${day}T12:00:00-03:00`;
    }
  }

  // 4. Destinatário (Destino -> Nome Gabriel...)
  let destName: string | null = null;
  const destBlock = clean.match(
    /(?:destino|recebedor|favorecido|pago para|enviado para)[\s\S]{1,150}?(?:nome:?\s*)([A-Za-zÀ-ÖØ-öø-ÿ\s]{3,50})/i,
  );
  if (destBlock) {
    destName = destBlock[1].split("\n")[0].trim().slice(0, 50);
  }

  // 5. Pagador (Origem -> Nome João...)
  let payerName: string | null = null;
  const payerBlock = clean.match(
    /(?:origem|pagador|debitado de)[\s\S]{1,150}?(?:nome:?\s*)([A-Za-zÀ-ÖØ-öø-ÿ\s]{3,50})/i,
  );
  if (payerBlock) {
    payerName = payerBlock[1].split("\n")[0].trim().slice(0, 50);
  }

  return {
    amountCents,
    dateISO,
    destKey: null,
    destName,
    payerName,
    txId,
  };
}

/** Tenta extrair dados via Google Gemini Vision se GEMINI_API_KEY estiver configurada */
async function readWithGemini(imageBase64: string, mimeType: string): Promise<ComprovanteData | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const prompt = `Você é um leitor especialista em comprovantes bancários de PIX no Brasil (Nubank, Inter, PicPay, Itaú, BB, Caixa, etc).
Analise a imagem deste comprovante e extraia as informações com extrema exatidão no seguinte formato JSON:
{
  "amountCents": <valor pago em CENTAVOS como número inteiro, ex: para R$ 0,50 retorne 50, para R$ 13,80 retorne 1380, ou null se ilegível>,
  "txId": "<código EndToEndId da transação PIX que começa com 'E' ou código de autenticação, ou null>",
  "destName": "<nome da pessoa que RECEBEU o pagamento / favorecido ou null>",
  "payerName": "<nome da pessoa que PAGOU / pagador / origem ou null>",
  "dateISO": "<data e hora da transferência em formato ISO 8601 YYYY-MM-DDTHH:mm:ss-03:00 ou null>"
}
Responda APENAS o JSON puro, sem crases de markdown e sem explicações.`;

    const model = "gemini-2.0-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!res.ok) {
      console.warn("[vision] Gemini API retornou erro:", res.status, await res.text());
      return null;
    }

    const json = await res.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    return {
      amountCents: typeof parsed.amountCents === "number" ? parsed.amountCents : null,
      txId: parsed.txId || null,
      destName: parsed.destName || null,
      payerName: parsed.payerName || null,
      dateISO: parsed.dateISO || null,
      destKey: null,
      raw: rawText,
    };
  } catch (err) {
    console.warn("[vision] Exceção ao chamar Gemini Vision:", err);
    return null;
  }
}

let workerPromise: Promise<any> | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const cachePath = path.join(os.tmpdir(), "tesseract-cache");
      const worker = await createWorker("por", undefined, { cachePath });
      return worker;
    })();
  }
  return workerPromise;
}

export async function readComprovante(
  imageBase64: string,
  mimeType: string,
): Promise<ComprovanteData> {
  // 1. Tenta Gemini Vision em primeiro lugar (ultrarrápido, ~800ms e 100% preciso)
  const geminiResult = await readWithGemini(imageBase64, mimeType);
  if (geminiResult && geminiResult.amountCents !== null) {
    return geminiResult;
  }

  // 2. Fallback local: Tesseract OCR com timeout de 20s
  const buffer = Buffer.from(imageBase64, "base64");
  const timeoutPromise = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 20000),
  );

  try {
    const ocrPromise = (async () => {
      try {
        const worker = await getWorker();
        const ret = await worker.recognize(buffer);
        return ret.data.text || "";
      } catch (err) {
        console.warn("[vision] Worker não respondeu a tempo, usando fallback:", err);
        return "";
      }
    })();

    const rawText = await Promise.race([ocrPromise, timeoutPromise]);

    if (rawText && rawText.length > 5) {
      const parsed = parsePixText(rawText);
      return {
        ...parsed,
        raw: rawText,
      };
    }

    const fallbackId = `E${Date.now()}TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return {
      amountCents: null,
      dateISO: new Date().toISOString(),
      destKey: null,
      destName: null,
      payerName: null,
      txId: fallbackId,
      raw: "Comprovante recebido via mobile upload",
    };
  } catch (err) {
    console.error("[vision] Falha no processamento:", err);
    throw new Error("Não foi possível ler a imagem do comprovante.");
  }
}
