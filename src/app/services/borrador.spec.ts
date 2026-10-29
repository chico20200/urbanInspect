import { TestBed } from '@angular/core/testing';
import { Borrador } from './borrador';

describe('Borrador', () => {
  let service: Borrador;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Borrador);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
