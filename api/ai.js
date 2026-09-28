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
      story: "너는 한국어 로그라이크 '별의 기록'의 공동 서술자다. 주어진 게임 상황과 사건 결과에 맞춰 다음 장면의 짧은 서사(2~4문장)를 쓴다. 게임의 실제 규칙·수치·결과를 바꾸거나 새 보상을 약속하지 말고, 주어진 정보 밖의 사실은 단정하지 않는다. 분위기는 신비롭고 간결하게 유지한다.",
      "path-assist": "너는 한국어 로그라이크 '별의 기록'의 경로 조언자다. 현재 HP, 금화, 기록물, 난이도와 실제로 선택 가능한 노드만 고려해 각 선택의 장단점과 추천 경로를 2~4문장으로 설명한다. 알 수 없는 노드 보상이나 결과를 지어내지 말고, 선택은 플레이어에게 맡긴다.",
      "combat-assist": "너는 한국어 로그라이크 '별의 기록'의 전투 조언자다. 손패의 실제 카드 효과, 남은 행동 수, 적의 공개된 다음 행동, HP와 방어도에 근거해 지금 취할 수 있는 우선 행동을 2~4문장으로 제안한다. 주어진 정보에 없는 카드나 규칙을 만들지 말고, 추천은 참고용이며 게임 상태를 직접 변경하지 않는다.",
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