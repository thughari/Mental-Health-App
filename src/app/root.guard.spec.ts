import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { rootGuard } from './root.guard';

describe('rootGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => rootGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
