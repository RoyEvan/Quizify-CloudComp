import Joi from 'joi';

// src\app\(frontend)\teacher\page.tsx
export const teacherSchema = Joi.object({
  title: Joi.string().min(3).max(50).required().messages({
      'string.empty': 'Title is required.',
      'string.min': 'Title must be at least 3 characters.',
      'string.max': 'Title must not exceed 50 characters.'
    }),
  datepick: Joi.required(),
  access_code: Joi.string().required().messages({
      'string.empty': 'Access code is required.',
    })
});

// src\app\(frontend)\teacher\quiz\question\add\page.tsx
export const questionSchema = Joi.object({
  type: Joi.string().valid("pg","ur","is").required().messages({
      'string.empty': 'Type is required.',
      'any.only': 'Type must be at least 1.'
    }),
  title: Joi.string().required().messages({
      'string.empty': 'Title is required.'
    }),
  answer_key: Joi.string().required().messages({
      'string.empty': 'Answer is required.'
    }),
  answers: Joi.array().items(
      Joi.object({
        answer: Joi.string().required().messages({
            "string.empty": "Answer is required.",
          }),
        img: Joi.any().optional(),
      })
    ).min(1).messages({
      "array.min": "Answer must be at least 1.",
    }),
});

// src\app\(frontend)\student\profile\page.tsx && src\app\(frontend)\teacher\profile\page.tsx
export const profileSchema = Joi.object({
  fullname: Joi.string().trim().min(1).required().messages({
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 1 character long",
    }),
  nickname: Joi.string().trim().min(1).required().messages({
      "string.empty": "Nickname is required",
      "string.min": "Nickname must be at least 1 character long",
    }),
});


