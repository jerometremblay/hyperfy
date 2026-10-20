import assert from 'node:assert/strict'
import test from 'node:test'
import { PhotoUploadLimits, isJPEGUpload, validatePhoto, MAX_PHOTO_BYTES } from './photoUploads.js'

test('JPEG detection covers extension and MIME type, validates signatures and caps bytes', () => {
  assert.ok(isJPEGUpload({ filename: 'photo.JPG', mimetype: 'application/octet-stream' }))
  assert.ok(isJPEGUpload({ filename: 'photo.bin', mimetype: 'image/jpeg' }))
  assert.equal(isJPEGUpload({ filename: 'model.glb' }), false)
  assert.doesNotThrow(() => validatePhoto(Buffer.from([255, 216, 255, 217])))
  assert.throws(() => validatePhoto(Buffer.from('not a jpeg')), { statusCode: 415 })
  assert.throws(() => validatePhoto(Buffer.alloc(MAX_PHOTO_BYTES + 1)), { statusCode: 413 })
})

test('JPEG attempts are limited per IP and expire after one minute', () => {
  const limits = new PhotoUploadLimits()
  for (let i = 0; i < 20; i++) limits.take('one', 100)
  assert.throws(() => limits.take('one', 101), { statusCode: 429 })
  assert.doesNotThrow(() => limits.take('two', 101))
  assert.doesNotThrow(() => limits.take('one', 60100))
  assert.equal(limits.windows.size, 2)
})
