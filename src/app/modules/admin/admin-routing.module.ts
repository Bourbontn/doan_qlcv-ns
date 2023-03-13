import { NgModule } from '@angular/core';
import { RouterModule , Routes } from '@angular/router';
import { ContentNoneComponent } from '@modules/admin/features/content-none/content-none.component';
import { DashboardComponent } from '@modules/admin/dashboard/dashboard.component';
import { HomeComponent } from '@modules/admin/features/home/home.component';
import { AdminGuard } from '@core/guards/admin.guard';

const routes : Routes = [
	{
		path             : '' ,
		component        : DashboardComponent ,
		canActivateChild : [ AdminGuard ] ,
		children         : [
			{
				path       : '' ,
				redirectTo : 'dashboard' ,
				pathMatch  : 'prefix'
			} ,
			{
				path      : 'dashboard' ,
				component : HomeComponent
			} ,
			{
				path      : 'content-none' ,
				component : ContentNoneComponent
			} ,
			{
				path         : 'he-thong' ,
				loadChildren : () => import('@modules/admin/features/he-thong/he-thong.module').then( m => m.HeThongModule )
			} ,
			{
				path: 'danhmuc',
				loadChildren: () => import('@modules/admin/features/danhmuc/danhmuc.module').then(m => m.DanhmucModule)
			  },
			{
				path         : 'cong-viec' ,
				loadChildren : () => import('@modules/admin/features/qlcv/qlcv.module').then( m => m.QlcvModule )
			} ,
			{
				path       : '**' ,
				redirectTo : '/admin/content-none' ,
				pathMatch  : 'prefix'
			}
		]
	}
];

@NgModule( {
	imports : [ RouterModule.forChild( routes ) ] ,
	exports : [ RouterModule ]
} )
export class AdminRoutingModule {}
