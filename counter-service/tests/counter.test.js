const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

const { app, redisClient, KEY_PREFIX } = require("../index");

const BOOK_ID = "6abd26fab6a3fdb4c11671eb";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  server.closeAllConnections();
});

test("GET /counter/:bookId отдаёт счётчик из ключа views:<bookId>", async (t) => {
  const get = t.mock.method(redisClient, "get", async () => "7");

  const res = await fetch(`${baseUrl}/counter/${BOOK_ID}`);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.deepEqual(body, { bookId: BOOK_ID, count: "7" });
  assert.equal(get.mock.callCount(), 1);
  assert.deepEqual(get.mock.calls[0].arguments, [`${KEY_PREFIX}${BOOK_ID}`]);
});

test("GET /counter/:bookId возвращает 1, если счётчика ещё нет", async (t) => {
  t.mock.method(redisClient, "get", async () => null);

  const res = await fetch(`${baseUrl}/counter/${BOOK_ID}`);

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { bookId: BOOK_ID, count: 1 });
});

test("POST /counter/:bookId/incr увеличивает счётчик и возвращает его", async (t) => {
  const incr = t.mock.method(redisClient, "incr", async () => 5);

  const res = await fetch(`${baseUrl}/counter/${BOOK_ID}/incr`, {
    method: "POST",
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.deepEqual(body, { status: "ok", count: 5 });
  assert.equal(incr.mock.callCount(), 1);
  assert.deepEqual(incr.mock.calls[0].arguments, [`${KEY_PREFIX}${BOOK_ID}`]);
});

test("оба эндпоинта отдают 400 на невалидный bookId и не трогают Redis", async (t) => {
  const get = t.mock.method(redisClient, "get", async () => "1");
  const incr = t.mock.method(redisClient, "incr", async () => 1);

  const invalid = [
    "session:6abd26fab6a3fdb4c11671eb",
    "6abd26fab6a3fdb4c11671e",
    "6abd26fab6a3fdb4c11671eb0",
    "6abd26fab6a3fdb4c11671eg",
    "not-an-id",
  ];

  for (const bookId of invalid) {
    const getRes = await fetch(`${baseUrl}/counter/${bookId}`);
    assert.equal(getRes.status, 400, `GET ${bookId}`);
    assert.deepEqual(await getRes.json(), { error: "Invalid bookId" });

    const postRes = await fetch(`${baseUrl}/counter/${bookId}/incr`, {
      method: "POST",
    });
    assert.equal(postRes.status, 400, `POST ${bookId}`);
    assert.deepEqual(await postRes.json(), { error: "Invalid bookId" });
  }

  assert.equal(get.mock.callCount(), 0);
  assert.equal(incr.mock.callCount(), 0);
});

test("bookId в нижнем регистре принимается, в верхнем — отклоняется", async (t) => {
  const get = t.mock.method(redisClient, "get", async () => "3");

  const lowerRes = await fetch(`${baseUrl}/counter/${BOOK_ID}`);
  assert.equal(lowerRes.status, 200);
  assert.deepEqual(await lowerRes.json(), { bookId: BOOK_ID, count: "3" });

  const upperRes = await fetch(`${baseUrl}/counter/${BOOK_ID.toUpperCase()}`);
  assert.equal(upperRes.status, 400);
  assert.deepEqual(await upperRes.json(), { error: "Invalid bookId" });

  assert.equal(get.mock.callCount(), 1);
});
