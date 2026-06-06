/**
 * DATABASE_URL의 DB가 없으면 생성
 */
const mysql = require("mysql2/promise");

function parseDatabaseUrl(raw) {
  const url = new URL(raw.replace(/^mysql:\/\//, "http://"));
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
  };
}

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.error("DATABASE_URL이 없습니다.");
    process.exit(1);
  }

  const { host, port, user, password, database } = parseDatabaseUrl(raw);
  if (!database) {
    console.error("DATABASE_URL에 데이터베이스 이름이 없습니다.");
    process.exit(1);
  }

  const isLocal = host === "localhost" || host === "127.0.0.1";
  if (!isLocal) {
    console.log(`클라우드 DB(${host}) — 로컬 DB 자동 생성 건너뜀`);
    return;
  }

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
  });

  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log(`데이터베이스 확인/생성: ${database}`);
  await conn.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
