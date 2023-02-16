import { NgModule } from '@angular/core';
import { RouterModule , Routes } from '@angular/router';
import { TaoHoSoComponent } from '@modules/admin/features/ho-so/tao-ho-so/tao-ho-so.component';
import { DanhSachHoSoComponent } from '@modules/admin/features/ho-so/danh-sach-ho-so/danh-sach-ho-so.component';
import { SuaHoSoComponent } from '@modules/admin/features/ho-so/sua-ho-so/sua-ho-so.component';

const routes : Routes = [
	{
		path      : 'tao-moi' ,
		component : TaoHoSoComponent
	} ,
	{
		path: 'cong-viec-theo-kh',
		component : DanhSachHoSoComponent
	} ,
	{
		path      : 'sua-ho-so' ,
		component : SuaHoSoComponent
	}
];

@NgModule( {
	imports : [ RouterModule.forChild( routes ) ] ,
	exports : [ RouterModule ]
} )
export class HoSoRoutingModule {}
