import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  ME3_SCHEMA_URL,
  ME3_LEGACY_VERSION,
  ME3_VERSION,
  ME3_WELL_KNOWN_PATH,
  Me3ProfileSchema,
  parseMe3Json,
  validateProfile,
} from "../dist/index.js";

const profile = (overrides = {}) => ({
  version: "0.3",
  kind: "person",
  visibility: "public",
  name: "Jane Doe",
  ...overrides,
});

test("exports the 0.3 protocol constants", () => {
  assert.equal(ME3_VERSION, "0.3");
  assert.equal(ME3_LEGACY_VERSION, "0.2");
  assert.equal(ME3_WELL_KNOWN_PATH, "/.well-known/me.json");
  assert.equal(
    ME3_SCHEMA_URL,
    "https://unpkg.com/me3-protocol@4.0.0/schema.json",
  );
});

test("simple and full examples satisfy runtime validation", async () => {
  for (const filename of ["simple.json", "full.json", "private.json"]) {
    const json = await readFile(new URL(`../examples/${filename}`, import.meta.url), "utf8");
    const result = parseMe3Json(json);
    assert.equal(result.valid, true, `${filename}: ${JSON.stringify(result.errors)}`);
  }
});

test("tracked JSON Schema is generated from the runtime schema", async () => {
  const tracked = JSON.parse(
    await readFile(new URL("../schema.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(tracked, {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    ...JSON.parse(JSON.stringify(Me3ProfileSchema)),
  });
  assert.equal(tracked.anyOf.length, 2);
  assert.equal(
    tracked.anyOf.every((branch) => branch.additionalProperties === false),
    true,
  );
});

test("current validation requires 0.3 visibility and rejects undeclared fields", () => {
  for (const value of [
    { version: "0.1", name: "Jane Doe" },
    { version: "0.3", kind: "person", name: "Jane Doe" },
    { version: "0.3", kind: "person", visibility: "friends", name: "Jane Doe" },
    { version: "0.2", kind: "person", name: "Jane Doe" },
    profile({ verification: { verified: true } }),
    profile({ blogEnabled: true }),
    profile({ links: { website: "https://example.com" } }),
  ]) {
    assert.equal(validateProfile(value).valid, false);
  }
});

test("compatibility parsing accepts legacy 0.2 documents", () => {
  const result = parseMe3Json(
    JSON.stringify({
      version: "0.2",
      kind: "person",
      name: "Legacy Jane",
      bio: "A previously public profile.",
    }),
  );
  assert.equal(result.valid, true);
  assert.equal(result.profile?.version, "0.2");
});

test("private profiles allow only the safe public identity projection", () => {
  const safe = profile({
    visibility: "private",
    handle: "janedoe",
    avatar: "./files/avatar.jpg",
  });
  assert.equal(validateProfile(safe).valid, true);

  for (const privateField of [
    { bio: "Private bio" },
    { banner: "./files/banner.jpg" },
    { links: [{ rel: "email", href: "mailto:jane@example.com" }] },
    { pages: [{ id: "about", title: "About", url: "./about" }] },
    { posts: [] },
    { products: [] },
    { services: [] },
    { business: {} },
    { location: "Cork" },
    { locationData: { label: "Cork", latitude: 51.9, longitude: -8.4, precision: "city" } },
    { actions: {} },
    { capabilities: {} },
    { extensions: { "example.com/private": true } },
  ]) {
    assert.equal(
      validateProfile({ ...safe, ...privateField }).valid,
      false,
      `private field leaked: ${Object.keys(privateField)[0]}`,
    );
  }
});

test("accepts namespaced public extensions but rejects unnamespaced ones", () => {
  assert.equal(
    validateProfile(
      profile({
        extensions: {
          "example.com/presentation": { theme: "plain" },
        },
      }),
    ).valid,
    true,
  );

  assert.equal(
    validateProfile(profile({ extensions: { presentation: {} } })).valid,
    false,
  );

  assert.equal(
    validateProfile(
      profile({ extensions: { "example.com/value": undefined } }),
    ).valid,
    false,
  );
});

test("uses one strict money representation", () => {
  const valid = profile({
    products: [
      {
        id: "guide",
        title: "Guide",
        price: { amount: "29.00", currency: "EUR" },
      },
    ],
  });
  assert.equal(validateProfile(valid).valid, true);

  const invalid = structuredClone(valid);
  invalid.products[0].price.amount = 2900;
  assert.equal(validateProfile(invalid).valid, false);
});

test("validates approximate location coordinates and provider-neutral place ids", () => {
  const valid = profile({
    locationData: {
      label: "Cork, Ireland",
      latitude: 51.89797,
      longitude: -8.47061,
      precision: "city",
      countryCode: "IE",
      placeId: "osm:node:123",
    },
  });
  assert.equal(validateProfile(valid).valid, true);

  const invalid = structuredClone(valid);
  invalid.locationData.latitude = 120;
  assert.equal(validateProfile(invalid).valid, false);
});

test("capabilities must reference declared actions and offerings", () => {
  const result = validateProfile(
    profile({
      capabilities: {
        book: {
          action: "missing-action",
          offeringIds: ["missing-service"],
        },
      },
    }),
  );

  assert.equal(result.valid, false);
  assert.deepEqual(
    result.errors.map((error) => error.field),
    ["capabilities.book.action", "capabilities.book.offeringIds"],
  );
});

test("offering ids are unique across products and services", () => {
  const result = validateProfile(
    profile({
      products: [
        {
          id: "session",
          title: "Recorded Session",
          price: { amount: "10.00", currency: "EUR" },
        },
      ],
      services: [{ id: "session", title: "Live Session" }],
    }),
  );

  assert.equal(result.valid, false);
  assert.equal(result.errors[0]?.field, "products[0].id");
});

test("actions are human HTTPS links or OpenAPI operation references", () => {
  const valid = profile({
    actions: {
      contact: { type: "link", url: "https://example.com/contact" },
      book: {
        type: "openapi",
        spec: "https://api.example.com/openapi.json",
        operationId: "createBooking",
      },
    },
    capabilities: {
      contact: { action: "contact" },
      book: { action: "book" },
    },
  });
  assert.equal(validateProfile(valid).valid, true);

  const unsafe = structuredClone(valid);
  unsafe.actions.contact.url = "http://example.com/contact";
  assert.equal(validateProfile(unsafe).valid, false);
});

test("public links and asset references reject executable URI schemes", () => {
  assert.equal(
    validateProfile(
      profile({ links: [{ rel: "website", href: "javascript:alert(1)" }] }),
    ).valid,
    false,
  );
  assert.equal(
    validateProfile(profile({ avatar: "data:text/html,hello" })).valid,
    false,
  );
});

test("parseMe3Json reports malformed JSON", () => {
  assert.deepEqual(parseMe3Json("{"), {
    valid: false,
    errors: [{ field: "root", message: "Invalid JSON" }],
  });
});
