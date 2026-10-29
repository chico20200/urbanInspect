import { TestBed } from '@angular/core/testing';
import { Seguimiento } from './seguimiento';

describe('Seguimiento', () => {
  let service: Seguimiento;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Seguimiento);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
