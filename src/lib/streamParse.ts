// ストリーミング中の不完全なJSONバッファから、配列内の「完成済みオブジェクト」だけを
// 逐次取り出すための増分パーサ。AIの出力は { "laws": [...], "precedents": [...], ... } という
// 1つのJSONなので、生成途中でも laws / precedents の各要素が閉じた時点でカードを出せるようにする。

export type ExtractResult = {
  // これまでに完成したオブジェクト（毎回先頭から全件。呼び出し側が既出件数と差分を取る）
  objects: Record<string, unknown>[];
  // 対象配列の閉じ括弧 ] まで到達したか
  closed: boolean;
};

// buffer 中の "key": [ ... ] という配列を走査し、閉じた {} オブジェクトを順に返す。
// 文字列リテラル内の括弧やエスケープを正しく無視する。
export function extractArrayObjects(buffer: string, key: string): ExtractResult {
  const objects: Record<string, unknown>[] = [];
  const keyIdx = buffer.indexOf(`"${key}"`);
  if (keyIdx === -1) return { objects, closed: false };

  let i = buffer.indexOf("[", keyIdx);
  if (i === -1) return { objects, closed: false };
  i++; // '[' の次へ

  const n = buffer.length;
  let closed = false;

  while (i < n) {
    const ch = buffer[i];
    if (ch === "]") {
      closed = true;
      break;
    }
    if (ch === "," || ch === " " || ch === "\n" || ch === "\r" || ch === "\t") {
      i++;
      continue;
    }
    if (ch !== "{") break; // 想定外の文字（まだ来ていない等）→ ここで停止

    // バランスの取れた {} を探す
    let depth = 0;
    let j = i;
    let inStr = false;
    let esc = false;
    let complete = false;
    for (; j < n; j++) {
      const c = buffer[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          j++; // '}' を含める
          complete = true;
          break;
        }
      }
    }

    if (!complete) break; // オブジェクトがまだ閉じていない → 次の delta を待つ

    try {
      objects.push(JSON.parse(buffer.slice(i, j)) as Record<string, unknown>);
    } catch {
      break; // 念のため：パースできなければ停止
    }
    i = j;
  }

  return { objects, closed };
}
