import test from "node:test";
import assert from "node:assert/strict";

import { parseMe3Json } from "../dist/index.js";

test("parseMe3Json accepts structured public location data", () => {
  const profile = {
    version: "0.1",
    name: "Kieran Butler",
    location: "Cork, County Cork, Ireland",
    locationData: {
      label: "Cork, County Cork, Ireland",
      latitude: 51.89797,
      longitude: -8.47061,
      precision: "city",
      locality: "Cork",
      region: "County Cork",
      country: "Ireland",
      countryCode: "IE",
      source: {
        provider: "photon",
        id: "N:123",
        osmType: "N",
        osmId: 123,
        osmKey: "place",
        osmValue: "city",
      },
    },
  };

  const result = parseMe3Json(JSON.stringify(profile));

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.profile?.locationData?.countryCode, "IE");
});

test("parseMe3Json rejects invalid structured location coordinates", () => {
  const profile = {
    version: "0.1",
    name: "Kieran Butler",
    locationData: {
      label: "Somewhere",
      latitude: 120,
      longitude: -8.47061,
      precision: "city",
    },
  };

  const result = parseMe3Json(JSON.stringify(profile));

  assert.equal(result.valid, false);
  assert.equal(result.errors[0]?.field, "locationData.latitude");
});
