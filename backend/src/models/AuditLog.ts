import { Schema, model } from 'mongoose'

const auditSchema = new Schema({
  adminId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action:     { type: String, required: true },
  targetId:   { type: String, required: true },
  targetType: { type: String, required: true },
  before:     { type: Schema.Types.Mixed },
  after:      { type: Schema.Types.Mixed },
  ip:         { type: String },
}, { timestamps: true })

export const AuditLog = model('AuditLog', auditSchema)