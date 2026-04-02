// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 🔥 중요: SSL 인증서 에러(self-signed certificate)를 무시합니다.
// 개발 중에 네트워크 차단이나 보안 프로그램으로 인한 연결 오류를 해결해줍니다.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ 에러: .env 파일에 GEMINI_API_KEY가 없습니다.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

app.post('/api/recommend-outfit', async (req, res) => {
  try {
    const { name, tempC, humidity, wind } = req.body;
    console.log(`요청 도착: ${name}, ${tempC}도`);

    // 사용자님께서 말씀하신 2.5-flash 모델 사용
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: "당신은 센스있는 패션 스타일리스트입니다. 날씨에 맞는 옷차림을 2문장 이내의 한국어로 간결하게 추천해주세요."
    });

    const promptText = `현재 위치: ${name}, 기온: ${tempC}도, 습도: ${humidity}%, 풍속: ${wind}km/h. 이 날씨에 어울리는 실용적인 옷차림을 추천해줘.`;

    const result = await model.generateContent(promptText);
    const responseText = result.response.text();

    console.log("✅ AI 응답 성공!");
    res.json({ recommendation: responseText });

  } catch (error) {
    // 🔥 에러가 왜 났는지 더 자세히 출력합니다.
    console.error("❌ Gemini API 호출 오류 상세:");
    if (error.cause) {
      console.error("- 원인:", error.cause); // 네트워크 끊김, 타임아웃 등 상세 정보
    } else {
      console.error("- 메시지:", error.message);
    }
    
    res.status(500).json({ error: "AI 추천을 가져오는 데 실패했습니다." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  console.log(`✅ Gemini 2.5 Flash 모델 설정 완료`);
});