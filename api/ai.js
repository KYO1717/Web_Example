// api/ai.js

const MODEL = "gemini-2.5-flash";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 로만 부를 수 있습니다." });
  }

  // ———————————————————————————————— 1. 키 꺼내서 청소하기 ————————————————————————————————

  const NAMES = ["GEMINI_API_TEST", "GEMINI_API_KEY"];
  const found = NAMES.find(function (n) {
    return process.env[n];
  });
  const raw = found ? process.env[found] : null;

  if (!raw) {
    console.error("키 없음. 찾아본 이름:", NAMES.join(", "));
    return res.status(500).json({
      error:
        "서버에 키가 없습니다. Vercel 환경 변수 이름을 " +
        NAMES.join(" 또는 ") +
        " 중 하나로 맞추고 다시 배포하세요.",
    });
  }

  const key = raw.trim().replace(/^["']|["']$/g, "");

  console.log("키 확인:", { 이름: found, 길이: key.length, 앞4글자: key.slice(0, 4) });

  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: "prompt 가 비어 있습니다." });
  }

  
  // ———————————————————————————————— 2. Gemini 부르기 ————————————————————————————————
  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
        MODEL +
        ":generateContent?key=" +
        encodeURIComponent(key),
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      }
    );

    const data = await r.json();

    // 이 아래는 에러 처리하는 부분이므로 특별한 경우가 아니라면 그대로 두는 것을 추천

    if (!r.ok) {
      console.error("Gemini 오류:", r.status, JSON.stringify(data));

      if (r.status === 400 || r.status === 401 || r.status === 403) {
        return res.status(500).json({
          error:
            "Gemini API 키가 거부됐습니다(" + r.status + "). Google AI Studio에서 키를 새로 만들어 " +
            "Vercel 환경 변수 " + found + " 에 다시 넣고 재배포하세요.",
        });
      }

      if (r.status === 404) {
        return res.status(500).json({
          error:
            "모델 '" + MODEL + "' 을(를) 쓸 수 없습니다(404). Gemini 모델 이름을 확인하세요.",
        });
      }

      if (r.status === 429) {
        return res.status(429).json({
          error:
            "Gemini 요청 한도를 초과했습니다(429). 잠시 후 다시 시도하거나 Google AI Studio의 할당량을 확인하세요.",
        });
      }

      return res.status(502).json({ error: "AI 서버에서 오류가 났습니다. (" + r.status + ")" });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("Gemini 응답에 텍스트가 없습니다:", JSON.stringify(data));
      return res.status(502).json({ error: "Gemini 응답을 해석하지 못했습니다." });
    }

    return res.status(200).json({ text: text });
  } catch (e) {
    console.error("Gemini 연결 실패:", e);
    return res.status(502).json({ error: "AI 서버에 연결하지 못했습니다." });
  }
}