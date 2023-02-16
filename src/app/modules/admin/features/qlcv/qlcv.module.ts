import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QlcvRoutingModule } from './qlcv-routing.module';
import { TaiLieuComponent } from './tai-lieu/tai-lieu.component';
import { YeuCauComponent } from './yeu-cau/yeu-cau.component';
import { ChiTietCongViecComponent } from './chi-tiet-cong-viec/chi-tiet-cong-viec.component';
import { GiaiDoanCongViecComponent } from './giai-doan-cong-viec/giai-doan-cong-viec.component';
import { DanhSachCongViecComponent } from './danh-sach-cong-viec/danh-sach-cong-viec.component';
import { ThongKeComponent } from './thong-ke/thong-ke.component';

import { ProgressBarModule } from 'primeng/progressbar';
import { MenuModule } from 'primeng/menu';
import { TableModule } from 'primeng/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { FileUploadModule } from 'primeng/fileupload';
import { HttpClientModule } from '@angular/common/http';
import { InputTextModule } from 'primeng/inputtext';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { PaginatorModule } from 'primeng/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import {TieredMenuModule} from 'primeng/tieredmenu';
import {EditorModule} from 'primeng/editor';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import {DialogModule} from 'primeng/dialog';

@NgModule({
  declarations: [
    TaiLieuComponent,
    YeuCauComponent,
    ChiTietCongViecComponent,
    GiaiDoanCongViecComponent,
    DanhSachCongViecComponent,
    ThongKeComponent,
  ],
  imports: [
    CommonModule,
    QlcvRoutingModule,
    ProgressBarModule,
    MenuModule,
    TableModule,
    FormsModule,
    DropdownModule,
    CalendarModule,
    FileUploadModule,
    HttpClientModule,
    ReactiveFormsModule,
    InputTextModule,
    MatListModule,
    MatIconModule,
    MatPaginatorModule,
    PaginatorModule,
    MatMenuModule,
    TieredMenuModule,
    EditorModule,
    OverlayPanelModule,
    DialogModule
  ]
})
export class QlcvModule { }
