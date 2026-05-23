const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    userName: {
      type: String,
      required: [true, 'userName is required'],
      trim: true,
      minlength: [2, 'userName must be at least 2 characters'],
      maxlength: [100, 'userName must not exceed 100 characters'],
    },
    accountNumber: {
      type: String,
      required: [true, 'accountNumber is required'],
      unique: true,
      trim: true,
      match: [/^\d{6,20}$/, 'accountNumber must be 6-20 digits'],
    },
    emailAddress: {
      type: String,
      required: [true, 'emailAddress is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    identityNumber: {
      type: String,
      required: [true, 'identityNumber is required'],
      unique: true,
      trim: true,
      match: [/^\d{10,20}$/, 'identityNumber must be 10-20 digits'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

userSchema.index({ accountNumber: 1 }, { unique: true, name: 'idx_accountNumber' });
userSchema.index({ identityNumber: 1 }, { unique: true, name: 'idx_identityNumber' });
userSchema.index({ emailAddress: 1 }, { unique: true, name: 'idx_emailAddress' });

const User = mongoose.model('User', userSchema);

module.exports = User;
