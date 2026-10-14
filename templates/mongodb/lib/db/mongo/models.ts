import mongoose, { Schema, type Model } from "mongoose";

export interface UserDoc {
  name: string;
  email: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true, // unique index
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    emailVerifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export interface RefreshTokenDoc {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  userAgent: string | null;
  ip: string | null;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDoc>(
  {
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true }, // sha256 of the token
    familyId: { type: String, required: true, index: true },
    // TTL index: MongoDB deletes the document once expiresAt has passed.
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    revokedAt: { type: Date, default: null },
    replacedByTokenId: { type: String, default: null },
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export interface UserTokenDoc {
  userId: string;
  type: "email_verify" | "password_reset";
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

const userTokenSchema = new Schema<UserTokenDoc>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ["email_verify", "password_reset"], required: true },
    tokenHash: { type: String, required: true, unique: true }, // sha256 of the token
    // TTL index: MongoDB deletes the document once expiresAt has passed.
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    usedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const UserModel: Model<UserDoc> =
  mongoose.models.User || mongoose.model<UserDoc>("User", userSchema);

export const UserTokenModel: Model<UserTokenDoc> =
  mongoose.models.UserToken || mongoose.model<UserTokenDoc>("UserToken", userTokenSchema);

export const RefreshTokenModel: Model<RefreshTokenDoc> =
  mongoose.models.RefreshToken ||
  mongoose.model<RefreshTokenDoc>("RefreshToken", refreshTokenSchema);
