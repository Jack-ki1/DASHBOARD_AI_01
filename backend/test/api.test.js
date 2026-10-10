import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), "dash-ai-")), "test.db");

const { createApp } = await import("../src/app.js");

let base;
let server;
const json = (r) => r.json();

before(async () => {
  const { app } = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server?.close();
});

async function req(path, { method = "GET", body, token } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await json(res) };
}

describe("health", () => {
  it("reports ok with demo AI when unconfigured", async () => {
    const { status, body } = await req("/api/health");
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.data.ai, "demo");
  });
});

describe("auth", () => {
  it("registers, rejects duplicates, logs in, rejects bad passwords", async () => {
    const reg = await req("/api/auth/register", {
      method: "POST",
      body: { email: "QA@Example.com", password: "password123" },
    });
    assert.equal(reg.status, 201);
    assert.ok(reg.body.data.token);
    assert.equal(reg.body.data.user.email, "qa@example.com");

    const dup = await req("/api/auth/register", {
      method: "POST",
      body: { email: "qa@example.com", password: "password123" },
    });
    assert.equal(dup.status, 409);
    assert.equal(dup.body.error, "EMAIL_TAKEN");

    const bad = await req("/api/auth/login", {
      method: "POST",
      body: { email: "qa@example.com", password: "wrong-password" },
    });
    assert.equal(bad.status, 401);

    const login = await req("/api/auth/login", {
      method: "POST",
      body: { email: "qa@example.com", password: "password123" },
    });
    assert.equal(login.status, 200);
    assert.ok(login.body.data.token);

    const me = await req("/api/auth/me", { token: login.body.data.token });
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.email, "qa@example.com");

    const anon = await req("/api/auth/me");
    assert.equal(anon.status, 401);
  });

  it("validates credentials", async () => {
    const res = await req("/api/auth/register", {
      method: "POST",
      body: { email: "not-an-email", password: "short" },
    });
    assert.equal(res.status, 400);
  });
});

const dashboard = {
  name: "QA dashboard",
  theme: "light",
  widgets: [{ id: "w1", type: "kpi", title: "Total Sales", metric: "Sales", w: 3, h: 1 }],
  dataset: { name: "Mini", columns: ["Month", "Sales"], rows: [{ Month: "Jan", Sales: 10 }] },
  filters: {},
};

describe("dashboards", () => {
  let token;
  let id;
  before(async () => {
    const login = await req("/api/auth/login", {
      method: "POST",
      body: { email: "qa@example.com", password: "password123" },
    });
    token = login.body.data.token;
  });

  it("requires auth", async () => {
    const res = await req("/api/dashboards");
    assert.equal(res.status, 401);
  });

  it("creates, reads, updates, lists and deletes", async () => {
    const created = await req("/api/dashboards", { method: "POST", body: dashboard, token });
    assert.equal(created.status, 201);
    id = created.body.data.id;
    assert.ok(id);

    const got = await req(`/api/dashboards/${id}`, { token });
    assert.equal(got.status, 200);
    assert.equal(got.body.data.name, "QA dashboard");

    const updated = await req(`/api/dashboards/${id}`, {
      method: "PUT",
      body: { ...dashboard, name: "Renamed", published: true, favorite: true },
      token,
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.name, "Renamed");

    const list = await req("/api/dashboards", { token });
    assert.equal(list.status, 200);
    assert.equal(list.body.data.length, 1);

    const shared = await req(`/api/dashboards/shared/${id}`);
    assert.equal(shared.status, 200);
    assert.equal(shared.body.data.name, "Renamed");

    const deleted = await req(`/api/dashboards/${id}`, { method: "DELETE", token });
    assert.equal(deleted.status, 200);

    const gone = await req(`/api/dashboards/${id}`, { token });
    assert.equal(gone.status, 404);
    const sharedGone = await req(`/api/dashboards/shared/${id}`);
    assert.equal(sharedGone.status, 404);
  });

  it("does not share unpublished dashboards", async () => {
    const created = await req("/api/dashboards", { method: "POST", body: dashboard, token });
    const pub = await req(`/api/dashboards/shared/${created.body.data.id}`);
    assert.equal(pub.status, 404);
  });

  it("isolates users from each other", async () => {
    const other = await req("/api/auth/register", {
      method: "POST",
      body: { email: "other@example.com", password: "password123" },
    });
    const list = await req("/api/dashboards", { token: other.body.data.token });
    assert.equal(list.body.data.length, 0);
  });
});

describe("ai", () => {
  let token;
  before(async () => {
    const login = await req("/api/auth/login", {
      method: "POST",
      body: { email: "qa@example.com", password: "password123" },
    });
    token = login.body.data.token;
  });

  it("requires auth", async () => {
    const res = await req("/api/ai/generate", { method: "POST", body: { prompt: "sales" } });
    assert.equal(res.status, 401);
  });

  it("answers 503 AI_NOT_CONFIGURED without a provider", async () => {
    const gen = await req("/api/ai/generate", {
      method: "POST",
      body: { prompt: "sales dashboard" },
      token,
    });
    assert.equal(gen.status, 503);
    assert.equal(gen.body.error, "AI_NOT_CONFIGURED");
    const edit = await req("/api/ai/edit", {
      method: "POST",
      body: { instruction: "dark theme", columns: ["Sales"], theme: "light", widgets: [] },
      token,
    });
    assert.equal(edit.status, 503);
  });
});
