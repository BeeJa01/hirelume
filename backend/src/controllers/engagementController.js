const mongoose = require('mongoose');
const { z } = require('zod');
const { Rating, AnalyticsEvent, Application } = require('../models');
const { asyncRoute, validate } = require('../utils');

const ratingSchema = z.object({
  application_id: z.string().optional(),
  value: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).default(''),
});
const eventSchema = z.object({
  name: z.string().trim().min(1).max(80).regex(/^[a-z][a-z0-9_.-]*$/),
  anonymous_id: z.string().trim().min(8).max(120).optional(),
  properties: z.record(z.string(), z.unknown()).default({}),
  occurred_at: z.coerce.date().optional(),
});

const createRating = asyncRoute(async (req, res) => {
  const input = validate(ratingSchema, req.body);
  let applicationId = null;
  if (input.application_id) {
    if (!mongoose.isValidObjectId(input.application_id)) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
    const application = await Application.findOne({ _id: input.application_id, user_id: req.user._id }).lean();
    if (!application) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
    applicationId = application._id;
  }
  const rating = await Rating.findOneAndUpdate(
    { user_id: req.user._id, application_id: applicationId },
    { value: input.value, comment: input.comment },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
  return res.status(201).json({ id: String(rating._id), value: rating.value, comment: rating.comment });
});

const createEvent = asyncRoute(async (req, res) => {
  const input = validate(eventSchema, req.body);
  if (!req.user && !input.anonymous_id) return res.status(422).json({ detail: 'ANONYMOUS_ID_REQUIRED' });
  if (Buffer.byteLength(JSON.stringify(input.properties)) > 10_000) return res.status(413).json({ detail: 'EVENT_PROPERTIES_TOO_LARGE' });
  await AnalyticsEvent.create({
    name: input.name,
    anonymous_id: input.anonymous_id || null,
    user_id: req.user?._id || null,
    properties: input.properties,
    occurred_at: input.occurred_at || new Date(),
  });
  return res.status(202).json({ accepted: true });
});

module.exports = { createRating, createEvent };
