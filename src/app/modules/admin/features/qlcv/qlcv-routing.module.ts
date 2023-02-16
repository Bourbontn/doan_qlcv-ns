import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChiTietCongViecComponent } from './chi-tiet-cong-viec/chi-tiet-cong-viec.component';
import { DanhSachCongViecComponent } from './danh-sach-cong-viec/danh-sach-cong-viec.component';
import { TaiLieuComponent } from './tai-lieu/tai-lieu.component';
import { YeuCauComponent } from './yeu-cau/yeu-cau.component';

const routes: Routes = [
  {
    path: 'danh-sach-cong-viec', component: DanhSachCongViecComponent
  },
  {
    path: 'chi-tiet-cong-viec', component: ChiTietCongViecComponent
  },
  {
    path: 'quan-ly-yeu-cau',component: YeuCauComponent
  },
  {
    path: 'quan-ly-tai-lieu',component: TaiLieuComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QlcvRoutingModule { }

