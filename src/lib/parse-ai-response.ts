export function extractJsonFromAIResponse(text: string): object {
  let jsonStr = text;

  if (jsonStr.includes('```json')) {
    jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
  } else if (jsonStr.includes('```')) {
    jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
  }

  const match = jsonStr.match(/(\{[\s\S]*\})/);
  if (match) jsonStr = match[1];

  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error('AI 응답을 JSON으로 파싱할 수 없습니다.');
  }
}
