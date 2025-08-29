import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { KeycloakService } from './utils/keycloak/KeycloakService';
import { keycloakHttpInterceptor } from './utils/http/keycloak-http-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([keycloakHttpInterceptor])),
    provideAppInitializer(()=>{
      const initFn = ((keycloakService: KeycloakService) => {
        return () => keycloakService.init()
      })(inject(KeycloakService))

      return initFn()

    })
  ]
};
