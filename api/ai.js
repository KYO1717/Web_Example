// api/ai.js


// ★ Groq 무료 플랜에서 쓸 수 있는 모델인데 더 똑똑한 답 원하면 "openai/gpt-oss-120b"로 바꿔도 돼요 (근데 조금 느림)
const MODEL = "openai/gpt-oss-20b";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 로만 부를 수 있습니다." });
  }

  // ———————————————————————————————— 1. 키 꺼내서 청소하기 ————————————————————————————————

  const NAMES = ["GROQ_API_TEST", "GROQ_API_KEY"];
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

  
  //
  // ———————————————————————————————— 2. Groq 부르기 ————————————————————————————————
  
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await r.json();

    // 이 아래는 에러 처리하는 부분이므로 특별한 경우가 아니라면 그대로 두는 것을 추천

    if (!r.ok) {
      console.error("Groq 오류:", r.status, JSON.stringify(data));

      if (r.status === 401) {
        return res.status(500).json({
          error:
            "Groq 키가 거부됐습니다(401). Groq 콘솔에서 키를 새로 만들어 " +
            "Vercel 환경 변수 " + found + " 에 다시 넣고 재배포하세요.",
        });
      }

      if (r.status === 404) {
        return res.status(500).json({
          error:
            "모델 '" + MODEL + "' 을(를) 쓸 수 없습니다(404). " +
            "무료 플랜에서 쓸 수 있는 모델(openai/gpt-oss-20b 등)로 바꾸세요.",
        });
      }
      return res.status(502).json({ error: "AI 서버에서 오류가 났습니다. (" + r.status + ")" });
    }

    return res.status(200).json({ text: data.choices[0].message.content });
  } catch (e) {
    console.error("Groq 연결 실패:", e);
    return res.status(502).json({ error: "AI 서버에 연결하지 못했습니다." });
  }
}