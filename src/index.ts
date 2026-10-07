import { Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

export const ME3_VERSION = "0.3" as const;
export const ME3_LEGACY_VERSION = "0.2" as const;
export const ME3_FILENAME = "me.json" as const;
export const ME3_WELL_KNOWN_PATH = "/.well-known/me.json" as const;
export const ME3_SCHEMA_URL =
  "https://raw.githubusercontent.com/soulinkfoundation/me3-protocol/v4.1.0/schema.json" as const;
export const ME3_LEGACY_SCHEMA_URL =
  "https://unpkg.com/me3-protocol@3.0.0/schema.json" as const;

const ID_PATTERN = "^[A-Za-z0-9][A-Za-z0-9._:-]*$";
const URI_PATTERN = "^[A-Za-z][A-Za-z0-9+.-]*:";
const HTTPS_PATTERN = "^https://";
const LINK_URI_PATTERN = "^(https://|mailto:|tel:)";
const ASSET_REFERENCE_PATTERN = "^(https://|\\./|/)";
const MONEY_PATTERN = "^(0|[1-9][0-9]*)(\\.[0-9]+)?$";
const CURRENCY_PATTERN = "^[A-Z]{3}$";
const COUNTRY_CODE_PATTERN = "^[A-Z]{2}$";
const EXTENSION_KEY_PATTERN =
  "^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?/[A-Za-z0-9][A-Za-z0-9._-]*$";

const Id = Type.String({ minLength: 1, maxLength: 120, pattern: ID_PATTERN });
const Uri = Type.String({ minLength: 1, maxLength: 2048, pattern: URI_PATTERN });
const LinkUri = Type.String({
  minLength: 1,
  maxLength: 2048,
  pattern: LINK_URI_PATTERN,
});
const HttpsUri = Type.String({
  minLength: 9,
  maxLength: 2048,
  pattern: HTTPS_PATTERN,
});
const AssetReference = Type.String({
  minLength: 1,
  maxLength: 2048,
  pattern: ASSET_REFERENCE_PATTERN,
});
const ShortText = Type.String({ minLength: 1, maxLength: 160 });
const Description = Type.String({ minLength: 1, maxLength: 1000 });
const JsonValue = Type.Recursive((This) =>
  Type.Union([
    Type.String(),
    Type.Number(),
    Type.Boolean(),
    Type.Null(),
    Type.Array(This),
    Type.Record(Type.String(), This),
  ]),
);

export const Me3MoneySchema = Type.Object(
  {
    amount: Type.String({ pattern: MONEY_PATTERN }),
    currency: Type.String({ pattern: CURRENCY_PATTERN }),
  },
  {
    additionalProperties: false,
    description:
      "A non-negative decimal amount in major currency units and an ISO 4217 currency code.",
  },
);
export type Me3Money = Static<typeof Me3MoneySchema>;

export const Me3LinkSchema = Type.Object(
  {
    rel: Type.String({
      minLength: 1,
      maxLength: 80,
      pattern: "^[a-z][a-z0-9._-]*$",
    }),
    href: LinkUri,
    label: Type.Optional(ShortText),
  },
  { additionalProperties: false },
);
export type Me3Link = Static<typeof Me3LinkSchema>;

export const Me3PageSchema = Type.Object(
  {
    id: Id,
    title: ShortText,
    url: AssetReference,
  },
  { additionalProperties: false },
);
export type Me3Page = Static<typeof Me3PageSchema>;

export const Me3MediaSchema = Type.Object(
  {
    url: AssetReference,
    durationSeconds: Type.Optional(Type.Number({ minimum: 0 })),
    thumbnail: Type.Optional(AssetReference),
  },
  { additionalProperties: false },
);
export type Me3Media = Static<typeof Me3MediaSchema>;

export const Me3PostSchema = Type.Object(
  {
    id: Id,
    title: ShortText,
    url: AssetReference,
    type: Type.Optional(
      Type.Union([
        Type.Literal("article"),
        Type.Literal("note"),
        Type.Literal("video"),
        Type.Literal("audio"),
        Type.Literal("image"),
        Type.Literal("link"),
      ]),
    ),
    media: Type.Optional(Me3MediaSchema),
    publishedAt: Type.Optional(Type.String({ minLength: 1, maxLength: 80 })),
    excerpt: Type.Optional(Type.String({ minLength: 1, maxLength: 500 })),
  },
  { additionalProperties: false },
);
export type Me3Post = Static<typeof Me3PostSchema>;
export type Me3PostType = NonNullable<Me3Post["type"]>;

export const Me3ProductSchema = Type.Object(
  {
    id: Id,
    title: ShortText,
    description: Type.Optional(Description),
    url: Type.Optional(AssetReference),
    price: Me3MoneySchema,
    images: Type.Optional(Type.Array(AssetReference, { maxItems: 20 })),
    available: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);
export type Me3Product = Static<typeof Me3ProductSchema>;

export const Me3ServiceSchema = Type.Object(
  {
    id: Id,
    title: ShortText,
    description: Type.Optional(Description),
    url: Type.Optional(AssetReference),
    sessionType: Type.Optional(ShortText),
    durationMinutes: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
    price: Type.Optional(Me3MoneySchema),
    whoItsFor: Type.Optional(Type.Array(ShortText, { maxItems: 30 })),
    outcomes: Type.Optional(Type.Array(ShortText, { maxItems: 30 })),
    availability: Type.Optional(
      Type.Union([
        Type.Literal("calendar"),
        Type.Literal("external"),
        Type.Literal("manual"),
      ]),
    ),
    status: Type.Optional(
      Type.Union([Type.Literal("active"), Type.Literal("paused")]),
    ),
  },
  { additionalProperties: false },
);
export type Me3Service = Static<typeof Me3ServiceSchema>;

export const Me3BusinessContextSchema = Type.Object(
  {
    positioningStatement: Type.Optional(
      Type.String({ minLength: 1, maxLength: 320 }),
    ),
    audience: Type.Optional(ShortText),
    primaryProblem: Type.Optional(ShortText),
    solution: Type.Optional(Type.String({ minLength: 1, maxLength: 240 })),
    targetMarket: Type.Optional(ShortText),
    primaryOutcome: Type.Optional(
      Type.String({ minLength: 1, maxLength: 240 }),
    ),
  },
  { additionalProperties: false },
);
export type Me3BusinessContext = Static<typeof Me3BusinessContextSchema>;

export const Me3LocationDataSchema = Type.Object(
  {
    label: Type.String({ minLength: 1, maxLength: 160 }),
    latitude: Type.Number({ minimum: -90, maximum: 90 }),
    longitude: Type.Number({ minimum: -180, maximum: 180 }),
    precision: Type.Union([
      Type.Literal("locality"),
      Type.Literal("city"),
      Type.Literal("district"),
      Type.Literal("county"),
      Type.Literal("region"),
      Type.Literal("country"),
      Type.Literal("unknown"),
    ]),
    locality: Type.Optional(ShortText),
    region: Type.Optional(ShortText),
    country: Type.Optional(ShortText),
    countryCode: Type.Optional(Type.String({ pattern: COUNTRY_CODE_PATTERN })),
    placeId: Type.Optional(
      Type.String({ minLength: 3, maxLength: 200, pattern: URI_PATTERN }),
    ),
  },
  {
    additionalProperties: false,
    description:
      "Approximate public place data. Publishers should use locality-level coordinates, never a private street address.",
  },
);
export type Me3LocationData = Static<typeof Me3LocationDataSchema>;
export type Me3LocationPrecision = Me3LocationData["precision"];

export const Me3LinkActionSchema = Type.Object(
  {
    type: Type.Literal("link"),
    url: HttpsUri,
    description: Type.Optional(Description),
  },
  {
    additionalProperties: false,
    description: "A human-facing HTTPS flow.",
  },
);
export type Me3LinkAction = Static<typeof Me3LinkActionSchema>;

export const Me3OpenApiActionSchema = Type.Object(
  {
    type: Type.Literal("openapi"),
    spec: HttpsUri,
    operationId: Id,
    description: Type.Optional(Description),
  },
  {
    additionalProperties: false,
    description:
      "An operation described by a public OpenAPI document. Discovery does not grant authority to invoke it.",
  },
);
export type Me3OpenApiAction = Static<typeof Me3OpenApiActionSchema>;

export const Me3ActionDefinitionSchema = Type.Union([
  Me3LinkActionSchema,
  Me3OpenApiActionSchema,
]);
export type Me3ActionDefinition = Static<typeof Me3ActionDefinitionSchema>;

export const Me3CapabilitySchema = Type.Object(
  {
    action: Id,
    title: Type.Optional(ShortText),
    description: Type.Optional(Description),
    offeringIds: Type.Optional(
      Type.Array(Id, { maxItems: 100, uniqueItems: true }),
    ),
  },
  { additionalProperties: false },
);
export type Me3Capability = Static<typeof Me3CapabilitySchema>;

const ProfileKind = Type.Union([
  Type.Literal("person"),
  Type.Literal("organization"),
  Type.Literal("application"),
  Type.Literal("agent"),
]);
const ProfileName = Type.String({ minLength: 1, maxLength: 100 });
const ProfileHandle = Type.Optional(
  Type.String({
    minLength: 1,
    maxLength: 60,
    pattern: "^[A-Za-z0-9_-]+$",
  }),
);

const FullProfileProperties = {
  id: Type.Optional(Uri),
  url: Type.Optional(HttpsUri),
  handle: ProfileHandle,
  bio: Type.Optional(Type.String({ minLength: 1, maxLength: 16384 })),
  avatar: Type.Optional(AssetReference),
  banner: Type.Optional(AssetReference),
  location: Type.Optional(Type.String({ minLength: 1, maxLength: 160 })),
  locationData: Type.Optional(Me3LocationDataSchema),
  links: Type.Optional(Type.Array(Me3LinkSchema, { maxItems: 200 })),
  pages: Type.Optional(Type.Array(Me3PageSchema, { maxItems: 500 })),
  posts: Type.Optional(Type.Array(Me3PostSchema, { maxItems: 5000 })),
  products: Type.Optional(Type.Array(Me3ProductSchema, { maxItems: 500 })),
  business: Type.Optional(Me3BusinessContextSchema),
  services: Type.Optional(Type.Array(Me3ServiceSchema, { maxItems: 500 })),
  actions: Type.Optional(
    Type.Record(Type.String({ pattern: ID_PATTERN }), Me3ActionDefinitionSchema, {
      additionalProperties: false,
    }),
  ),
  capabilities: Type.Optional(
    Type.Record(Type.String({ pattern: ID_PATTERN }), Me3CapabilitySchema, {
      additionalProperties: false,
    }),
  ),
  extensions: Type.Optional(
    Type.Record(Type.String({ pattern: EXTENSION_KEY_PATTERN }), JsonValue, {
      additionalProperties: false,
    }),
  ),
};

export const Me3PublicProfileSchema = Type.Object(
  {
    $schema: Type.Optional(Type.Union([Type.Literal(ME3_SCHEMA_URL), Type.Literal("https://unpkg.com/me3-protocol@4.0.1/schema.json")])),
    version: Type.Literal(ME3_VERSION),
    kind: ProfileKind,
    visibility: Type.Literal("public"),
    name: ProfileName,
    ...FullProfileProperties,
  },
  {
    title: "Public me3 Profile 0.3",
    description: "The full public profile and capability manifest.",
    additionalProperties: false,
  },
);
export type Me3PublicProfile = Static<typeof Me3PublicProfileSchema>;

export const Me3PrivateProfileSchema = Type.Object(
  {
    $schema: Type.Optional(Type.Union([Type.Literal(ME3_SCHEMA_URL), Type.Literal("https://unpkg.com/me3-protocol@4.0.1/schema.json")])),
    version: Type.Literal(ME3_VERSION),
    kind: ProfileKind,
    visibility: Type.Literal("private"),
    name: ProfileName,
    handle: ProfileHandle,
    avatar: Type.Optional(AssetReference),
    banner: Type.Optional(AssetReference),
  },
  {
    title: "Private me3 Profile Projection 0.3",
    description:
      "A minimal safe public identity projection. Full private content requires a separate authenticated endpoint.",
    additionalProperties: false,
  },
);
export type Me3PrivateProfile = Static<typeof Me3PrivateProfileSchema>;

export const Me3ProfileSchema = Type.Union(
  [Me3PublicProfileSchema, Me3PrivateProfileSchema],
  {
    $id: "urn:me3:protocol:0.3",
    title: "me3 Protocol Profile 0.3",
    description:
      "A visibility-aware portable public profile and capability manifest.",
  },
);
export type Me3Profile = Static<typeof Me3ProfileSchema>;

export const Me3LegacyProfileSchema = Type.Object(
  {
    $schema: Type.Optional(Type.Literal(ME3_LEGACY_SCHEMA_URL)),
    version: Type.Literal(ME3_LEGACY_VERSION),
    kind: ProfileKind,
    name: ProfileName,
    ...FullProfileProperties,
  },
  {
    title: "Legacy me3 Protocol Profile 0.2",
    additionalProperties: false,
  },
);
export type Me3LegacyProfile = Static<typeof Me3LegacyProfileSchema>;

export const Me3CompatibleProfileSchema = Type.Union([
  Me3ProfileSchema,
  Me3LegacyProfileSchema,
]);
export type Me3CompatibleProfile = Static<typeof Me3CompatibleProfileSchema>;

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<TProfile = Me3CompatibleProfile> {
  valid: boolean;
  errors: ValidationError[];
  profile?: TProfile;
}

function fieldFromJsonPointer(path: string): string {
  const segments = path
    .split("/")
    .slice(1)
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));

  return (
    segments.reduce(
      (field, segment) =>
        /^\d+$/.test(segment)
          ? `${field}[${segment}]`
          : field
            ? `${field}.${segment}`
            : segment,
      "",
    ) || "root"
  );
}

function semanticErrors(profile: Me3CompatibleProfile): ValidationError[] {
  const errors: ValidationError[] = [];
  const offeringIds = new Set<string>();
  const services = "services" in profile ? profile.services || [] : [];
  const products = "products" in profile ? profile.products || [] : [];

  for (const [collection, offerings] of [
    ["services", services],
    ["products", products],
  ] as const) {
    offerings.forEach((offering, index) => {
      if (offeringIds.has(offering.id)) {
        errors.push({
          field: `${collection}[${index}].id`,
          message: `Offering id must be unique: ${offering.id}`,
        });
      }
      offeringIds.add(offering.id);
    });
  }

  const actions = "actions" in profile ? profile.actions || {} : {};
  const capabilities =
    "capabilities" in profile ? profile.capabilities || {} : {};
  for (const [name, capability] of Object.entries(capabilities)) {
    if (!(capability.action in actions)) {
      errors.push({
        field: `capabilities.${name}.action`,
        message: `Unknown action: ${capability.action}`,
      });
    }

    for (const offeringId of capability.offeringIds || []) {
      if (!offeringIds.has(offeringId)) {
        errors.push({
          field: `capabilities.${name}.offeringIds`,
          message: `Unknown offering: ${offeringId}`,
        });
      }
    }
  }

  return errors;
}

export function validateProfile(data: unknown): ValidationResult<Me3Profile> {
  const errors = Array.from(Value.Errors(Me3ProfileSchema, data), (error) => ({
    field: fieldFromJsonPointer(error.path),
    message: error.message,
  }));

  if (errors.length > 0) return { valid: false, errors };

  const profile = data as Me3Profile;
  const references = semanticErrors(profile);
  if (references.length > 0) return { valid: false, errors: references };

  return { valid: true, errors: [], profile };
}

export function validateCompatibleProfile(
  data: unknown,
): ValidationResult<Me3CompatibleProfile> {
  const errors = Array.from(
    Value.Errors(Me3CompatibleProfileSchema, data),
    (error) => ({
      field: fieldFromJsonPointer(error.path),
      message: error.message,
    }),
  );

  if (errors.length > 0) return { valid: false, errors };

  const profile = data as Me3CompatibleProfile;
  const references = semanticErrors(profile);
  if (references.length > 0) return { valid: false, errors: references };

  return { valid: true, errors: [], profile };
}

export function parseMe3Json(jsonString: string): ValidationResult {
  try {
    return validateCompatibleProfile(JSON.parse(jsonString));
  } catch {
    return {
      valid: false,
      errors: [{ field: "root", message: "Invalid JSON" }],
    };
  }
}
