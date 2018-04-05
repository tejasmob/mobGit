import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ActionSheetController, AlertController, Platform, ActionSheetOptions } from 'ionic-angular';
import { ActionSheetButton } from 'ionic-angular/components/action-sheet/action-sheet-options';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

import { AuthenticationService } from '../authentication/authentication.service';
import { UserService } from '../user/user.service';
import { I18nService } from '../i18n.service';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  providers: [UserService]
})
export class ShellComponent implements OnInit {

  navRoot: Component;
  subscription: any;
  userData: any;

  constructor(private router: Router,
              private activatedRoute: ActivatedRoute,
              private translateService: TranslateService,
              private platform: Platform,
              private alertController: AlertController,
              private actionSheetController: ActionSheetController,
              private authenticationService: AuthenticationService,
              private userService: UserService,
              private i18nService: I18nService) {
                this.userService.getUser().subscribe(user => {
                  this.userData = user;
              });
              }

  ngOnInit() {
    this.updateNav(this.activatedRoute);

    // Bind Ionic navigation to Angular router events
    this.subscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.updateNav(this.activatedRoute));
    }

  showProfileActions() {
    const actionSheetOptions: ActionSheetOptions = { title: this.username || undefined };
    const actionSheet = this.actionSheetController.create(actionSheetOptions);
    const buttons: ActionSheetButton[] = [
      {
        text: this.translateService.instant('Logout'),
        icon: this.platform.is('ios') ? undefined : 'log-out',
        role: 'destructive',
        handler: () => this.logout()
      },
      {
        text: this.translateService.instant('Change language'),
        icon: this.platform.is('ios') ? undefined : 'globe',
        handler: () => {
          // Wait for action sheet dismiss animation to finish, see "Dismissing And Async Navigation" section in:
          // http://ionicframework.com/docs/api/components/action-sheet/ActionSheetController/#advanced
          actionSheet.dismiss().then(() => this.changeLanguage());
          return false;
        }
      },
      {
        text: this.translateService.instant('Cancel'),
        icon: this.platform.is('ios') ? undefined : 'close',
        role: 'cancel'
      }
    ];

    // On Cordova platform language is set to the device language
    if (this.platform.is('cordova')) {
      buttons.splice(1, 1);
    }

    buttons.forEach(button => actionSheet.addButton(button));
    actionSheet.present();
  }

  get username(): string | null {
    return this.userData ? this.userData.name : null;
  }
  get userpic(): string | null {
    return this.userData ? this.userData.avatar_url : null;
  }

  private logout() {
    this.authenticationService.logout()
    .subscribe(() => this.router.navigate(['/login'], { replaceUrl: true }));
  }

  get isWeb(): boolean {
    return !this.platform.is('cordova');
  }

  private changeLanguage() {
    this.alertController
      .create({
        title: this.translateService.instant('Change language'),
        inputs: this.i18nService.supportedLanguages.map(language => ({
          type: 'radio',
          label: language,
          value: language,
          checked: language === this.i18nService.language
        })),
        buttons: [
          {
            text: this.translateService.instant('Cancel'),
            role: 'cancel'
          },
          {
            text: this.translateService.instant('Ok'),
            handler: language => {
              this.i18nService.language = language;
            }
          }
        ]
      })
      .present();
  }

  private updateNav(route: ActivatedRoute) {
    if (!route || !route.firstChild) {
      return;
    }
    // First component should always be IonicApp
    route = route.firstChild;
    if (route && route.component === ShellComponent && route.firstChild) {
      // Loop needed for lazy-loaded routes, see: https://github.com/angular/angular/issues/19420
      while (route.firstChild) {
        route = route.firstChild;
      }

      this.navRoot = <Component>route.component;
    }
  }

}
