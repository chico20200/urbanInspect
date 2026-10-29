import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidenciaCardComponent } from './incidencia-card.component';

describe('IncidenciaCardComponent', () => {
  let component: IncidenciaCardComponent;
  let fixture: ComponentFixture<IncidenciaCardComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IncidenciaCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
