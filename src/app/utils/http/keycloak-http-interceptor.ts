import { HttpHeaders, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { KeycloakService } from '../keycloak/KeycloakService';

export const keycloakHttpInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloakService = inject(KeycloakService);
  const token = keycloakService.keycloak.token;
  if (token) {
    const authRequest = req.clone({
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    });
    return next(authRequest);
  }
  return next(req);
};
