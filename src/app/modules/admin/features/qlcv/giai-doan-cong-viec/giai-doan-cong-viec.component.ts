import { Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { chiTietGiaiDoan, giaiDoanCongViec } from '@modules/shared/models/giai-doan-cong-viec';
import { DsCongViecService } from '@modules/shared/services/ds-cong-viec.service';
import { GiaiDoanCongViecChiTietService } from '@modules/shared/services/giai-doan-cong-viec-chi-tiet.service';
import { GiaiDoanCongViecService } from '@modules/shared/services/giai-doan-cong-viec.service';
import { data } from 'autoprefixer';
import { debounceTime, distinctUntilChanged, forkJoin, Subject } from 'rxjs';

@Component({
  selector: 'app-giai-doan-cong-viec',
  templateUrl: './giai-doan-cong-viec.component.html',
  styleUrls: ['./giai-doan-cong-viec.component.css']
})
export class GiaiDoanCongViecComponent implements OnInit {

  @Output() needReloadData = new EventEmitter<string>();

  @ViewChild("formChitietgd") formChitietgd: TemplateRef<any>;
  @ViewChild("formGd") formGd: TemplateRef<any>;

  data_gd: giaiDoanCongViec[];
  data_ctgd: chiTietGiaiDoan[];
  search: string = '';
  param_mcv: string = '';

  private OBSERVER_SEARCH_DATA = new Subject<string>();
  constructor(
    private formBuilder: FormBuilder,
    public dsCongViecService: DsCongViecService,
    private giaiDoanCongViecService: GiaiDoanCongViecService,
    private giaiDoanCongViecChiTietService: GiaiDoanCongViecChiTietService,
    private notificationService: NotificationService,
    private activatedRoute: ActivatedRoute,
    private auth: AuthService,
    private helperService: HelperService

  ) { this.OBSERVER_SEARCH_DATA.asObservable().pipe(distinctUntilChanged(), debounceTime(500)).subscribe(() => this.loadData()); }

  public id_gdoan: number;
  permission = {
    isExpert: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
  }
  ngOnInit(): void {
    this.activatedRoute.queryParams
      .subscribe(params => {
        this.param_mcv = this.auth.decryptData(params['code']);
      }
      );
    this.loadData();
    const isStaffExpert = this.auth.roles.reduce((collector, role) => collector || role === 'dans_lanh_dao', false);
    this.permission.isExpert = isStaffExpert;
    this.permission.canAdd = isStaffExpert;
    this.permission.canEdit = isStaffExpert;
    this.permission.canDelete = isStaffExpert;
  }

  loadData() {

    let sttGiaidoan = 0;
    const filter = this.param_mcv ? { search: this.param_mcv.trim() } : null;
    forkJoin([
      this.dsCongViecService.list(1, filter),
      this.giaiDoanCongViecService.list(1, filter),
      this.giaiDoanCongViecChiTietService.get_list_CTGD_count(),
    ]).subscribe(
      {
        next: ([dsCV, dsGDCV, _count]) => {
          this.notificationService.isProcessing(false);
          this.data_gd = dsGDCV.map(
            gDoan => {
              gDoan['__sttGiaidoan'] = ++sttGiaidoan;
              gDoan['count_giaidoan'] = _count.filter(m => m.id_giaidoan.toString() === gDoan.id.toString()).length;
              gDoan['data_chitietgiaidoan'] = _count.filter(m => m.id_giaidoan.toString() === gDoan.id.toString());
              gDoan['count_trangthai'] = _count.filter(m => m.trang_thai === 1 && m.id_giaidoan.toString() === gDoan.id.toString()).length;
              this.showStatus_trangthai(gDoan['data_chitietgiaidoan']);
              
              return gDoan;
            }
          );

        },

        error: (err: any) => {
          this.notificationService.isProcessing(false);
        },
      }
    )
  }

  //tr???ng th??i c??ng vi???c ??ang l??m | ???? xong v?? tr???ng th??i c???a ng??y h???t h???n
  showStatus_trangthai(dt) {
    dt.forEach((f) => {
      if ((f.trang_thai) === 0) {
        f['bg_trangthai'] = 'work-doing';
        f['label_trangthai'] = '??ang l??m';
        if (new Date(f.ngay_hethan) < new Date()) {
          f['bg_trangthai'] = 'work-unfinished';
          f['label_trangthai'] = "qu?? h???n";
          // f['bg_trangthai'] = 'work-unfinished';
          // f['label_trangthai'] = 'kh??ng ho??n th??nh';
        }
      }
      else {
        f['bg_ngayhethan'] = '';
        f['label_ngayhethan'] = '';
        f['bg_trangthai'] = 'work-finish';
        f['label_trangthai'] = "ho??n th??nh";
        f.checked = true;
        f.disabled_tbn = true;
      }
    }
    )
  }
  //th??m giai ??o???n 
  formData: FormGroup = this.formBuilder.group({
    ma_congviec: [''],
    ten_giaidoan: ['', [Validators.required]],
  });

  formState: {
    formType: 'add' | 'edit',
    showForm: boolean,
    formTitle: string,
    object: giaiDoanCongViec | null
  } = {
      formType: 'add',
      showForm: false,
      formTitle: '',
      object: null
    }

  onOpenFormEdit() {
    this.notificationService.openSideNavigationMenu({
      template: this.formGd,
      size: 500,
    })
  }

  btnAddGiaiDoan() {
    this.changeInputMode("add");
  }
  btnEditGiaiDoan(object: giaiDoanCongViec) {
    this.onOpenFormEdit();
    this.changeInputMode('edit', object);
  }
  btnCancelGiaiDoan() {
    this.notificationService.closeSideNavigationMenu();
  }

  changeInputMode(formType: 'add' | 'edit', object: giaiDoanCongViec | null = null) {
    this.formState.formTitle = formType === 'add' ? 'Th??m giai ??o???n c??ng vi???c ' : 'C???p nh???t giai ??o???n vi???c';
    this.formState.formType = formType;
    if (formType === 'add') {
      this.formData.reset(
        {
          ma_congviec: this.param_mcv,
          ten_giaidoan: '',
        }
      )
    } else {
      this.formState.object = object;
      this.formData.reset({
        ma_congviec: this.param_mcv,
        ten_giaidoan: object?.ten_giaidoan,
      })
    }
  }

  updateForm() {
    if (this.formData.valid) {
      if (this.formState.formType === 'add') {
        this.notificationService.isProcessing(true);
        this.giaiDoanCongViecService.create(this.formData.value).subscribe({
          next: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastSuccess("th??nh c??ng");
            this.loadData();
            this.formData.reset(
              {
                ma_congviec: this.param_mcv,
                ten_giaidoan: '',
              }
            );

          }, error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastError("Th??m th???t b???i");
          }
        })
      } else {
        this.notificationService.isProcessing(true);
        const index = this.data_gd.findIndex(r => r.id === this.formState.object.id);
        this.giaiDoanCongViecService.edit(this.data_gd[index].id, this.formData.value).subscribe({
          next: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastSuccess('C???p nh???t th??nh c??ng');
            this.loadData();
            this.btnCancelGiaiDoan();

          }, error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastError("C???p nh???t th???t b???i th???t b???i");
          }
        })
      }
    }
    else {
      this.notificationService.toastError("L???i ch??a nh???p t??n giai ??o???n");
    }
  }

  delete_GD(GD: giaiDoanCongViec) {
    this.notificationService.isProcessing(true);
    this.giaiDoanCongViecService.delete(GD.id).subscribe(
      {
        next: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Xo?? th??nh c??ng');
          this.loadData();
          this.needReloadData.emit('refresh-data');
        },
        error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastWarning('Xo?? th???t b???i');
        }
      }
    )
  }

  async btnDelete(data: giaiDoanCongViec) {
    const xacNhanXoa = await this.notificationService.confirmDelete();
    if (xacNhanXoa) {
      this.notificationService.isProcessing(true);
      this.giaiDoanCongViecService.delete(data.id).subscribe({
        next: () => {
          this.notificationService.isProcessing(false);
          this.loadData();
        },
        error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Thao t??c th???t b???i');
        }
      });
    }
  }

  //Th??m s???a xo?? chi ti???t giai ??o???n c??ng vi???c
  formData_chitietgd: FormGroup = this.formBuilder.group({
    id_giaiDoan: [0],
    chi_tiet_giai_doan: ['', [Validators.required]],
    ngay_hethan: ['', [Validators.required]],
    trang_thai: [0]
  });


  formState_chitietgd: {
    formType: 'add' | 'edit',
    showForm: boolean,
    formTitle: string,
    object: chiTietGiaiDoan | null
  } = {
      formType: 'add',
      showForm: false,
      formTitle: '',
      object: null
    }

  onOpenFormAddCTGD() {
    this.notificationService.openSideNavigationMenu({
      template: this.formChitietgd,
      size: 500,
    })
  }

  btnAddCTGD(id: any) {
    this.id_gdoan = id;
    this.onOpenFormAddCTGD();
    this.changeInputModeChiTiet("add");
  }

  btnEditCTGD(object: chiTietGiaiDoan,) {
    this.onOpenFormAddCTGD();
    this.changeInputModeChiTiet('edit', object);
  }
  btnCancelCTGD() {
    this.notificationService.closeSideNavigationMenu();
  }


  changeInputModeChiTiet(formType: 'add' | 'edit', object: chiTietGiaiDoan | null = null) {
    this.formState_chitietgd.formTitle = formType === 'add' ? 'Th??m c??ng vi???c thu???c giai ??o???n' : 'C???p nh???t c??ng vi???c thu???c giai ??o???n';
    this.formState_chitietgd.formType = formType;
    if (formType === 'add') {
      this.formData_chitietgd.reset(
        {
          id_gdoan: this.id_gdoan,
          chi_tiet_giai_doan: '',
          ngay_hethan: '',
          trang_thai: 0,
        }
      )
    } else {
      this.formState_chitietgd.object = object;
      this.formData_chitietgd.reset({
        id_giaidoan: object.id_giaidoan,
        chi_tiet_giai_doan: object?.chi_tiet_giai_doan,
        ngay_hethan: object.ngay_hethan,
        trang_thai: 0
      })
    }
  }

  updateFormChiTiet() {
    if (this.formData_chitietgd.valid) {
      if (this.formState_chitietgd.formType === 'add') {
        this.notificationService.isProcessing(true);
        this.formData_chitietgd.get('id_giaiDoan').setValue(this.id_gdoan);
        this.giaiDoanCongViecChiTietService.create(this.formData_chitietgd.value).subscribe({
          next: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastSuccess("th??nh c??ng");
            this.loadData();
            this.needReloadData.emit('refresh-data');
            
            this.formData_chitietgd.reset(
              {
                chi_tiet_giai_doan: '',
                ngay_hethan: '',
                trang_thai: 0
              }
            )
            this.btnCancelCTGD();
          },
          error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastError("Th??m th???t b???i");
          }
        })
      } else {
        this.notificationService.isProcessing(true);
        const index = this.data_ctgd.findIndex(r => r.id === this.formState_chitietgd.object.id);
        this.formData_chitietgd.get('id_giaiDoan').setValue(this.id_gdoan);
        this.formData_chitietgd.get('trang_thai').setValue(0);
        this.giaiDoanCongViecChiTietService.edit(this.data_ctgd[index].id, this.formData_chitietgd.value).subscribe({
          next: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastSuccess('C???p nh???t th??nh c??ng');
          }, error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastError("C???p nh???t th???t b???i th???t b???i");
          }
        })
      }
    }
    else {
      this.notificationService.toastError("L???i ch??a nh???p li???u");
    }
  }

  delete_CTGD(CTGD: chiTietGiaiDoan) {
    this.notificationService.isProcessing(true);
    this.giaiDoanCongViecChiTietService.delete(CTGD.id).subscribe(
      {
        next: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Xo?? th??nh c??ng');
          this.loadData();
          this.needReloadData.emit('refresh-data');
        },
        error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastWarning('Xo?? th???t b???i');
        }
      }
    )
  }

  markCompleted(CTGD: chiTietGiaiDoan) {
    this.notificationService.isProcessing(true);
    this.giaiDoanCongViecChiTietService.edit(CTGD.id, { trang_thai: 1 }).subscribe(
      {
        next: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Ho??n Th??nh');
          this.needReloadData.emit('refresh-data');
          this.loadData();
        },
        error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastWarning('Th???t b???i');
        }
      }
    )
  }
}



    // if (this.dataSelection_ctgd.values) {
    //   const ids = [];
    //   // this.notificationService.isProcessing(true);
    //   let i = 0;
    //   this.dataSelection_ctgd.forEach((f, key) => {
    //     setTimeout(() => {
    //       this.giaiDoanCongViecChiTietService.edit(f.id, { trang_thai: 1 }).subscribe(() => {
    //         i = i + 1;
    //         if (i === this.dataSelection_ctgd.length) {
    //           this.notificationService.toastSuccess('Th??nh c??ng');
    //           this.loadData();
    //           this.notificationService.isProcessing(false);
    //         }

    //       }, () => {
    //         i = i + 1;
    //         if (i === this.dataSelection_ctgd.length) {
    //           this.notificationService.toastSuccess('Th??nh c??ng');
    //           this.loadData();
    //           this.notificationService.isProcessing(false);
    //         }
    //       })
    //     }, 50 * key)
    //   })

    // } else {
    //   this.notificationService.alertInfo("Th??ng b??o", "kh??ng c?? y??u c???u ???????c ch???n")
    // }


