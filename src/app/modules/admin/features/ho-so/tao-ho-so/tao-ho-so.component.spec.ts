import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaoHoSoComponent } from './tao-ho-so.component';

describe('TaoHoSoComponent', () => {
  let component: TaoHoSoComponent;
  let fixture: ComponentFixture<TaoHoSoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TaoHoSoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaoHoSoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
