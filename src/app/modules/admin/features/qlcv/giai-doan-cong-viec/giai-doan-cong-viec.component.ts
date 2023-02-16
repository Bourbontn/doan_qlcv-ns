import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { chiTietGiaiDoan, giaiDoanCongViec } from '@modules/shared/models/giai-doan-cong-viec';
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
  @ViewChild("gdFormEdit") gdFormEdit: TemplateRef<any>;

  data_gd: giaiDoanCongViec[];
  // data_gdBackup: giaiDoanCongViec[];
  // dataSelection_ctgd: chiTietGiaiDoan[];
  data_ctgd: chiTietGiaiDoan[];
  search: string = '';

  param_mcv: string = '';

  private OBSERVER_SEARCH_DATA = new Subject<string>();
  constructor(
    private formBuilder: FormBuilder,
    private giaiDoanCongViecService: GiaiDoanCongViecService,
    private giaiDoanCongViecChiTietService: GiaiDoanCongViecChiTietService,
    private notificationService: NotificationService,
    private activatedRoute: ActivatedRoute,
    private auth: AuthService,
    private helperService: HelperService

  ) { this.OBSERVER_SEARCH_DATA.asObservable().pipe(distinctUntilChanged(), debounceTime(500)).subscribe(() => this.loadData()); }

  public id_gdoan: number;

  ngOnInit(): void {
    this.activatedRoute.queryParams
      .subscribe(params => {
        this.param_mcv = this.auth.decryptData(params['code']);
      }
      );
    this.loadData();
  }

  loadData() {
    let sttGiaidoan = 0;
    const filter = this.param_mcv ? { search: this.param_mcv.trim() } : null;
    forkJoin([
      this.giaiDoanCongViecService.list(1, filter),
      this.giaiDoanCongViecChiTietService.get_list_CTGD_count(),
    ]).subscribe(
      {
        next: ([dsGDCV, _count]) => {
          this.notificationService.isProcessing(false);
          this.data_gd = dsGDCV.map(
            gDoan => {
              gDoan['__sttGiaidoan'] = ++sttGiaidoan;
              gDoan['count_giaidoan'] = _count.filter(m => m.id_giaidoan.toString() === gDoan.id.toString()).length;
              gDoan['data_chitietgiaidoan'] = _count.filter(m => m.id_giaidoan.toString() === gDoan.id.toString());
              gDoan['count_trangthai'] = _count.filter(m => m.trang_thai === 1 && m.id_giaidoan.toString() === gDoan.id.toString() ).length;
              // this.showStatus_date(gDoan['data_chitietgiaidoan']);
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

  //trạng thái công việc đang làm | đã xong và trạng thái của ngày hết hạn
  showStatus_trangthai(dt) {
    dt.forEach((f) => {
      if ((f.trang_thai) === 0) {
        f['bg_trangthai'] = 'work-doing';
        f['label_trangthai'] = 'đang làm';
        if (new Date(f.ngay_hethan) < new Date()) {
          f['bg_ngayhethan'] = 'work-unfinished';
          f['label_ngayhethan'] = "quá hạn";
          f['bg_trangthai'] = 'work-unfinished';
          f['label_trangthai'] = 'chưa hoàn thành';
        }
      }
      else {
        f['bg_ngayhethan'] = '';
        f['label_ngayhethan'] = '';
        f['bg_trangthai'] = 'work-finish';
        f['label_trangthai'] = "hoàn thành";
        f.checked = true;
        f.disabled_tbn = true;
      }
    }
    )
  }

  //thêm giai đoạn 
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

  btnAddGiaiDoan() {
    this.changeInputMode("add");
  }

  changeInputMode(formType: 'add' | 'edit', object: giaiDoanCongViec | null = null) {
    this.formState.formTitle = formType === 'add' ? 'Thêm giai đoạn công việc ' : 'Cập nhật giai đoạn việc';
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
            this.notificationService.toastSuccess("thành công");
            this.loadData();
            this.formData.reset(
              {
                ma_congviec: this.param_mcv,
                ten_giaidoan: '',
              }
            )
          }, error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastError("Thêm thất bại");
          }
        })
      } else {
        this.notificationService.isProcessing(true);
        // const index = this.data_yeucau.findIndex(r => r.id === this.formState.object.id);
        //   this.yeuCauService.edit(this.data_yeucau[index].id, this.formData.value).subscribe({
        //     next: () => {
        //       this.notificationService.isProcessing(false);
        //       this.notificationService.toastSuccess('Cập nhật thành công');
        //       this.loadData();
        //       this.closeSide();
        //     }, error: () => {
        //       this.notificationService.isProcessing(false);
        //       this.notificationService.toastError("Cập nhật thất bại thất bại");
        //     }
        //   })
        // }
      }
    }
    else {
      this.notificationService.toastError("Lỗi chưa nhập tên giai đoạn");
    }
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
          this.notificationService.toastError('Thao tác thất bại');
        }
      });
    }
  }

  //Thêm sửa xoá chi tiết giai đoạn công việc
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

  onOpenFormEdit() {
    this.notificationService.openSideNavigationMenu({
      template: this.gdFormEdit,
      size: 500,
    })
  }

  btnAddCTGD(id: any) {
    this.id_gdoan = id;
    this.onOpenFormEdit();
    this.changeInputMode("add");
  }

  btnEditCTGD(object: giaiDoanCongViec,) {
    this.onOpenFormEdit();
    this.changeInputMode('edit', object);
  }
  btnCancel() {
    this.notificationService.closeSideNavigationMenu();
  }


  changeInputModeChiTiet(formType: 'add' | 'edit', object: chiTietGiaiDoan | null = null) {
    this.formState_chitietgd.formTitle = formType === 'add' ? 'Thêm công việc thuộc giai đoạn' : 'Cập nhật công việc thuộc giai đoạn';
    this.formState_chitietgd.formType = formType;
    if (formType === 'add') {
      this.formData_chitietgd.reset(
        {
          // ma_congviec: this.param_id,
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
            this.notificationService.toastSuccess("thành công");
            this.loadData();
            this.formData_chitietgd.reset(
              {
                chi_tiet_giai_doan: '',
                ngay_hethan: '',
                trang_thai: 0
              }
            )
          }, error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastError("Thêm thất bại");

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
            this.notificationService.toastSuccess('Cập nhật thành công');
          }, error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastError("Cập nhật thất bại thất bại");
          }
        })
      }
    }
    else {
      this.notificationService.toastError("Lỗi chưa nhập liệu");
    }
  }

  delete_CTGD(CTGD: chiTietGiaiDoan) {
    this.notificationService.isProcessing(true);
    this.giaiDoanCongViecChiTietService.delete(CTGD.id).subscribe(
      {
        next: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Xoá thành công');
          this.loadData();
        },
        error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastWarning('Xoá thất bại');
        }
      }
    )
  }

  markCompleted(CTGD: chiTietGiaiDoan) {
    this.notificationService.isProcessing(true);
    this.giaiDoanCongViecChiTietService.edit(CTGD.id, {trang_thai: 1}).subscribe(
      {
        next: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Hoàn Thành');
          this.loadData();
          
        },
        error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastWarning('Thất bại');
        }
      }
    )
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
    //           this.notificationService.toastSuccess('Thành công');
    //           this.loadData();
    //           this.notificationService.isProcessing(false);
    //         }

    //       }, () => {
    //         i = i + 1;
    //         if (i === this.dataSelection_ctgd.length) {
    //           this.notificationService.toastSuccess('Thành công');
    //           this.loadData();
    //           this.notificationService.isProcessing(false);
    //         }
    //       })
    //     }, 50 * key)
    //   })

    // } else {
    //   this.notificationService.alertInfo("Thông báo", "không có yêu cầu được chọn")
    // }
  
}
