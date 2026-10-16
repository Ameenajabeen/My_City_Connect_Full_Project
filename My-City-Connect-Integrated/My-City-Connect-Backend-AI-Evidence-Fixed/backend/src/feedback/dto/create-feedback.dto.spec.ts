import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateFeedbackDto } from './create-feedback.dto';

describe('CreateFeedbackDto', () => {
  it('trims comment text and validates a legal rating', async () => {
    const dto = plainToInstance(CreateFeedbackDto, {
      rating: 5,
      comment: '  The drainage issue is fully resolved.  ',
    });

    expect(dto.comment).toBe('The drainage issue is fully resolved.');

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects feedback comments longer than 500 characters', async () => {
    const dto = plainToInstance(CreateFeedbackDto, {
      rating: 4,
      comment: 'x'.repeat(501),
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'comment')).toBe(true);
  });
});
