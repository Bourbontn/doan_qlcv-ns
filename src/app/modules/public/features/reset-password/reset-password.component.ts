import { Component , OnDestroy , OnInit } from '@angular/core';
import { state , style , trigger } from '@angular/animations';
import { Subscription } from 'rxjs';
import { FormBuilder , FormGroup , Validators } from '@angular/forms';
import { ActivatedRoute , ParamMap , Router } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';

@Component( {
	selector    : 'app-reset-password' ,
	templateUrl : './reset-password.component.html' ,
	styleUrls   : [ './reset-password.component.css' ] ,
	animations  : [
		trigger( 'showError' , [
			state( 'showed' , style( {
				opacity    : 1 ,
				visibility : 'visible' ,
				transform  : 'translateY(0)' ,
				'z-index'  : 10
			} ) ) ,
			state( 'hide' , style( {
				opacity    : 0 ,
				visibility : 'hidden' ,
				transform  : 'translateY(20px)' ,
				'z-index'  : -1
			} ) )
		] )
	]
} )
export class ResetPasswordComponent implements OnInit , OnDestroy {

	condition = false;

	errValidateForm = 'hide';

	errTimeOut = null;

	errMessage : string;

	subscription : Subscription;

	formConfirm : FormGroup;

	constructor(
		private formBuilder : FormBuilder ,
		private notificationService : NotificationService ,
		private auth : AuthService ,
		private route : ActivatedRoute ,
		private router : Router
	) {
		this.formConfirm = this.formBuilder.group( {
			token                 : [ '' , Validators.required ] ,
			password              : [ '' , [ Validators.required , Validators.minLength( 6 ) ] ] ,
			password_confirmation : [ '' , [ Validators.required , Validators.minLength( 6 ) ] ]
		} );
	}

	get f() {
		return this.formConfirm.controls;
	}

	ngOnInit() : void {
		this.subscription = this.route.queryParamMap.subscribe( params => this.setToken( params ) );
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
		if ( this.errTimeOut ) {
			clearTimeout( this.errTimeOut );
		}
	}

	setToken( param : ParamMap ) {
		if ( param.has( 'token' ) && param.get( 'token' ) ) {
			this.condition = true;
			this.f[ 'token' ].setValue( param.get( 'token' ) );
		}
	}

	checkData() {
		this.errValidateForm = 'hide';
		this.errMessage      = 'no message';
		clearTimeout( this.errTimeOut );

		if ( !this.f[ 'token' ].value ) {
			this.showError( 'token tr???ng, vui l??ng quay l???i trang ch???' );
			return;
		}

		if ( this.f[ 'password' ].invalid ) {
			this.showError( 'Tr?????ng m???t kh???u m???i ph???i c?? > 5 k?? t???' );
			return;
		}

		if ( this.f[ 'password_confirmation' ].invalid || this.f[ 'password' ].value !== this.f[ 'password_confirmation' ].value ) {
			this.showError( 'X??c nh???n m???t kh???u ph???i tr??ng kh???p v???i tr?????ng m???t kh???u' );
			return;
		}
		this.notificationService.isProcessing( true );
		this.auth.resetPassword( this.formConfirm.value ).subscribe(
			{
				next  : () => {
					this.notificationService.isProcessing( false );
					this.router.navigateByUrl( '/login' ).then( () => this.notificationService.toastSuccess( 'C???p nh???t m???t kh???u m???i th??nh c??ng' ) );
				} ,
				error : () => {
					this.notificationService.toastError( 'Thao t??c th???t b???i' );
					this.notificationService.isProcessing( false );
				}
			}
		);
	}

	showError( message : string ) {
		if ( this.errTimeOut ) {
			clearTimeout( this.errTimeOut );
		}
		this.errMessage      = message;
		this.errValidateForm = 'showed';
		this.errTimeOut      = setTimeout( () => this.errValidateForm = 'hide' , 3000 );
	}

}
