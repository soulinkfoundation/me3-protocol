# me3 Protocol (`me.json`)

**A portable public profile and capability index for people, organizations, applications, and agents.**

`me.json` gives humans and machines an authoritative public description of a subject: who they are, what they publish or offer, and where supported interactions begin.

It is discovery data. It is not authentication, authorization, delegation, private memory, account state, installation configuration, or proof that a claim is true.

## Example

```json
{
  "$schema": "https://unpkg.com/me3-protocol@5.0.0/schema.json",
  "version": "0.3",
  "kind": "person",
  "visibility": "public",
  "id": "https://janedoe.example/me.json",
  "url": "https://janedoe.example/",
  "name": "Jane Doe",
  "bio": "Independent consultant helping teams explain complex products clearly.",
  "links": [
    {
      "rel": "website",
      "href": "https://janedoe.example/"
    }
  ],
  "services": [
    {
      "id": "discovery-call",
      "title": "Discovery Call",
      "durationMinutes": 30,
      "price": {
        "amount": "0.00",
        "currency": "EUR"
      },
      "status": "active"
    }
  ],
  "actions": {
    "book": {
      "type": "link",
      "url": "https://janedoe.example/book"
    }
  },
  "capabilities": {
    "book": {
      "action": "book",
      "offeringIds": ["discovery-call"]
    }
  }
}
```

See [`examples/full.json`](./examples/full.json) for every protocol area.

## Contract

The required fields are:

| Field | Purpose |
| --- | --- |
| `version` | Protocol compatibility version; currently `0.3`. |
| `kind` | `person`, `organization`, `application`, or `agent`. |
| `visibility` | `public` for a full manifest or `private` for the safe identity projection. |
| `name` | Public display name. |

The optional public areas are:

| Area | Purpose |
| --- | --- |
| `id`, `url`, `handle`, `bio`, `avatar`, `banner` | Identity and presentation. |
| `location`, `locationData` | Deliberately approximate public location. |
| `links` | Explicit HTTPS, email, and telephone links. |
| `pages`, `posts` | Published content references. |
| `services`, `products` | Public offerings with stable IDs. |
| `actions` | Human links or operations in a public OpenAPI document. |
| `capabilities` | Named interactions that reference actions and offerings. |
| `extensions` | Namespaced experimental public data. |

Objects are strict: unknown fields are invalid everywhere except inside `extensions`. Extension keys use an owner namespace such as `example.com/presentation`.

### Profile visibility

`visibility: "public"` publishes the normal full manifest. `visibility: "private"` publishes only the protocol fields plus `name` and optional `handle`, `avatar`, and `banner`:

```json
{
  "version": "0.3",
  "kind": "person",
  "visibility": "private",
  "name": "Jane Doe",
  "handle": "janedoe",
  "avatar": "./files/avatar.jpg",
  "banner": "./files/banner.jpg"
}
```

A private projection cannot contain bio, location, links or contact details, pages, posts, products, services, actions, capabilities, or extensions. The avatar and banner remain public identity presentation. Full private content belongs behind a separate authenticated, audience-bound endpoint. It must never be returned from public `me.json` or stored in a public cache.

## Money

All prices use one representation:

```json
{
  "amount": "50.00",
  "currency": "EUR"
}
```

`amount` is a non-negative decimal string in major currency units. `currency` is a three-letter ISO 4217 code. Product policies such as minimum charges, flexible pricing, payment providers, and checkout state are not protocol data.

## Capabilities and actions

A capability says an interaction is publicly offered. It references:

- an entry in `actions`; and
- optionally, stable IDs from `services` or `products`.

Actions have only two forms:

- `link`: an HTTPS flow intended for a person;
- `openapi`: an `operationId` in a public HTTPS OpenAPI document.

`me.json` never grants permission to invoke an operation. Consumers must still apply authentication, authorization, consent, confirmation, and side-effect policies from the action API and their own runtime.

### Agent checkout

A capability whose action is an `openapi` operation can declare `agentCheckout`: the operation creates a checkout an agent can start on someone's behalf and that person then pays. `version` is the major version of the agent checkout contract; `offeringIds` optionally narrows it to some of the capability's offerings (all of them when omitted). Keep a human `link` action beside it for people and older clients.

```json
{
  "actions": {
    "book": {
      "type": "openapi",
      "spec": "https://janedoe.example/api/agent-commerce/v1/sites/janedoe/openapi.json",
      "operationId": "createCheckout"
    },
    "book-link": { "type": "link", "url": "https://janedoe.example/#booking" }
  },
  "capabilities": {
    "book": {
      "action": "book",
      "offeringIds": ["discovery-call"],
      "agentCheckout": { "version": "1" }
    }
  }
}
```

Agent checkout is discovery, not authority: the buyer's own runtime still decides whether to propose, and the person still approves and pays. Prices, availability, and checkout state come from the operation at purchase time, not from `me.json`.

## Public boundary

Good protocol data includes public identity, public content, public offerings, and public interaction entry points.

Do not publish:

- secrets, tokens, credentials, or private keys;
- private assistant memory, messages, contacts, tasks, or calendars;
- drafts or unpublished content;
- reminder settings, email templates, or delivery configuration;
- account, installation, billing, provider, or plugin state;
- payment customer/session identifiers or purchase records;
- self-asserted verification flags.

Hosting a document over HTTPS establishes control of that origin. It does not prove every claim in the document. Trust and attestations belong in separate systems.

## Location privacy

`locationData` is for opt-in local discovery. Coordinates must identify an approximate public place such as a locality, city, region, or country—never a home, workplace, or street address. `placeId` may hold a namespaced public identifier such as `osm:relation:62273`; lookup-provider internals do not belong in the document.

## Hosting and discovery

Serve the same document at:

1. `https://yourdomain.com/me.json`
2. `https://yourdomain.com/.well-known/me.json`

Responses must use:

- HTTPS;
- `Content-Type: application/json`;
- `Access-Control-Allow-Origin: *` so browser-based consumers can read public data without credentials.

Sites may also advertise `/me.json` with an HTTP `Link` header and an HTML `<link rel="alternate" type="application/json">` element.

Consumers should apply response-size limits, short timeouts, safe redirect handling, and SSRF protection when resolving user-supplied domains. Fetching a profile must never automatically invoke an advertised action.

## Install and validate

```bash
npm install me3-protocol@^4
```

```typescript
import { parseMe3Json, validateProfile } from "me3-protocol";

const objectResult = validateProfile(value);
const stringResult = parseMe3Json(jsonString);

if (!objectResult.valid) {
  console.error(objectResult.errors);
}
```

The package exports the inferred TypeScript types, runtime schemas, validators, and constants. [`schema.json`](./schema.json) is generated from the same runtime schema used by `validateProfile`.

## Versioning

The document protocol version and npm package version are independent:

- protocol `0.3` adds portable `public`/`private` visibility semantics;
- npm `4.0.0` marks the required field and current-schema validation boundary.
- npm `4.0.1` adds `banner` to the safe private identity projection.
- npm `4.1.0` permits rich bios and up to 200 public links, so 100 link-in-bio buttons can coexist with social links.
- npm `4.2.0` adds the optional `agentCheckout` capability field, so a capability whose action is an OpenAPI operation can say which offerings an agent can check out.
- npm `5.0.0` removes `business`. Who someone helps and why is their private Mission, kept by their own agent, so it is no longer part of a public profile. `validateProfile` rejects it; `parseMe3Json` drops it, so profiles published before v5 still parse. The `$schema` URL moves to npm (`me3-protocol@5.0.0`); documents pinned to the 4.x URLs (v4.2.0, v4.1.0, 4.0.1) stay valid.

`parseMe3Json` accepts both legacy `0.2` and current `0.3` documents during migration. `validateProfile` validates only current `0.3` documents, so new publishers cannot omit visibility or invent another value.

### Migrating from `0.2`

- Emit protocol `0.3` and add `visibility: "public"` to an existing public manifest.
- For a private profile, publish only the minimal safe projection described above.
- Serve full private content only from a separate authenticated endpoint with private, non-shared caching.

### Migrating from `0.1`

- Add `kind`; optionally add stable `id` and canonical `url`.
- Convert `links` from a provider-value object to `{ rel, href }[]` with explicit URIs.
- Convert pages, posts, products, and media from `slug`/`file` fields to stable `id` and public `url` fields.
- Convert every price to `{ amount, currency }` using major currency units.
- Replace `intents` with `capabilities`.
- Replace HTTP `method`/`requires` actions with human `link` actions or `openapi` operation references.
- Remove verification, footer/display controls, draft state, reminders, email templates, and other runtime configuration.
- Move genuinely public experimental fields into a namespaced `extensions` entry.

The public document version remains 0.3 across these releases.
