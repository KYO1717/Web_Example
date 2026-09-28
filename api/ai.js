// api/ai.js

const MODEL = "gemini-2.5-flash";

function buildPrompt(body) {
  const task = body && body.task;
  if (task === "story" || task === "path-assist" || task === "combat-assist") {
    const context = body.context;
    if (!context || typeof context !== "object" || Array.isArray(context)) return null;
    const contextText = JSON.stringify(context);
    if (contextText.length > 4000) return null;

    const instructions = {
      story: "너는 고전 판타지 던전 '기록자의 모험'을 안내하는 현자다. 상황은 파악하되 서사·요약·분위기 묘사는 쓰지 않는다. 지금 필요한 실용적인 조언만 한 문장, 60자 이내로 말한다. 확실한 조언이 없으면 억지로 만들지 않는다. 게임 규칙이나 결과를 지어내지 않는다.",
      "path-assist": "너는 고전 판타지 던전 '기록자의 모험'의 길잡이다. 생명력, 금화, 유물과 실제 선택 가능한 경로만 고려해 가장 적절한 선택 하나와 짧은 이유를 말한다. 한국어 한두 문장, 80자 이내. 인사·상황 반복·서사·장황한 나열은 금지. 알 수 없는 보상이나 결과를 지어내지 말고 선택은 모험가에게 맡긴다.",
      "combat-assist": "너는 고전 판타지 모험 '기록자의 모험'의 전투 현자다. 손패, 남은 행동 수, 몬스터의 공개된 다음 행동, 생명력과 방어도를 확인하고 지금 할 행동 하나와 이유를 추천한다. 한국어 한두 문장, 80자 이내. 인사·상황 반복·서사·불필요한 설명은 금지. 주어진 정보에 없는 규칙을 만들지 말고 게임 상태를 직접 바꾸지 않는다.",
    };
    return instructions[task] + "\n\n현재 게임 정보(JSON):\n" + contextText;
  }

  if (typeof body.prompt === "string" && body.prompt.trim() && body.prompt.length <= 3000) {
    return body.prompt.trim();
  }
  return null;
}

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

  const prompt = buildPrompt(req.body || {});
  if (!prompt) {
    return res.status(400).json({ error: "AI 작업 정보가 올바르지 않거나 너무 깁니다." });
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