import { state, style, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NotificationService } from '@core/services/notification.service';
import { DmChucdanh, DmChucvu, DmDanhhieu, DmDantoc, DmPhongban, DmTongiao } from '@modules/shared/models/danh_muc';
import { DmChucdanhService } from '@modules/shared/services/dm-chucdanh.service';
import { DmChucvuService } from '@modules/shared/services/dm-chucvu.service';
import { DmDanhhieuService } from '@modules/shared/services/dm-danhhieu.service';
import { DmDantocService } from '@modules/shared/services/dm-dantoc.service';
import { DmPhongbanService } from '@modules/shared/services/dm-phongban.service';
import { DmTongiaoService } from '@modules/shared/services/dm-tongiao.service';

@Component({
  selector: 'app-danhmuc-trinhdo',
  templateUrl: './danhmuc-trinhdo.component.html',
  styleUrls: ['./danhmuc-trinhdo.component.css'],
  animations: [
    trigger('menuPanel', [
      state('open', style({ 'left': '0' })),
      state('closed', style({ 'left': '-320px' }))
    ]),
    trigger('overlay', [
      state('open', style({
        'z-index': '999',
        'visibility': 'visible',
        'opacity': '1'
      })),
      state('closed', style({
        'z-index': '-100',
        'visibility': 'hidden',
        'opacity': '0'
      }))
    ])
  ]
})
export class DanhmucTrinhdoComponent implements OnInit {
  library: 'MY_DOCUMENT' | 'CLASS_DOCUMENT' = 'MY_DOCUMENT';
  libraryName = {
    MY_DOCUMENT: 'Tên công việc',
    CLASS_DOCUMENT: 'Tên công việc'
  };
  documentPack;
  showUploadPanel = false;
  studentClasses: any = [
    { name: "Chức danh" },
    { name: "Chức vụ" },
    { name: "Danh hiệu thi đua" },
    { name: "Dân tộc" },
    { name: "Phòng ban" },
    { name: "Tôn giáo" },
  ];
  studentClassesActive;
  panelLoading = false;
  emptyStore = false;

  dmChucdanh: DmChucdanh[];
  dmChucvu: DmChucvu[];
  dmDanhhieu: DmDanhhieu[];
  dmDantoc: DmDantoc[];
  dmPhongban: DmPhongban[];
  dmTongiao: DmTongiao[];

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private dmChucdanhService: DmChucdanhService,
    private dmChucvuService: DmChucvuService,
    private dmDanhhieuService: DmDanhhieuService,
    private dmDantocService: DmDantocService,
    private dmPhongbanService: DmPhongbanService,
    private dmTongiaoService: DmTongiaoService,
  ) { }

  ngOnInit(): void {
  }

  disableContextMenu(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  activeStudentClasses() {
    this.documentPack = true;
    if (this.studentClassesActive) {
      this.studentClassesActive['__active'] = false;
    }
    this.studentClasses['__active'] = true;
    this.studentClassesActive = this.studentClasses;

  }
}
