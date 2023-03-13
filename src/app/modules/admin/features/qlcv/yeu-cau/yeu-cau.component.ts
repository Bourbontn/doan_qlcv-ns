import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { YeuCauService } from '@modules/shared/services/yeu-cau.service';
import { DanhSachYeuCau } from '@modules/shared/models/yeu-cau';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '@core/services/notification.service';
import { FileService } from '@core/services/file.service';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';
import { HelperService } from '@core/services/helper.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { DsCongViecService } from '@modules/shared/services/ds-cong-viec.service';
import { PhongBan } from '@modules/shared/models/ds-cong-viec';

@Component({
  selector: 'app-yeu-cau',
  templateUrl: './yeu-cau.component.html',
  styleUrls: ['./yeu-cau.component.css']
})
export class YeuCauComponent implements OnInit {
  @ViewChild("nsFormEdit") nsFormEdit: TemplateRef<any>;
  data_yeucau: DanhSachYeuCau[];
  dmpb: PhongBan[];
  search = '';
  selectAll;
  selectCheckBox;
  dataSelection: DanhSachYeuCau[];
  permission = {
    isExpert: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
  }
  trangthai = [
    { label: 'Đang chờ duyệt', value: 'pending' },
    { label: 'Đã phê duyệt', value: 'approved' },
  ]

  formState: {
    formType: 'add' | 'edit',
    showForm: boolean,
    formTitle: string,
    object: DanhSachYeuCau | null
  } = {
      formType: 'add',
      showForm: false,
      formTitle: '',
      object: null
    }

  formData: FormGroup = this.formBuilder.group({
    tendexuat: ['', [Validators.required]],
    nguoidexuat: ['', [Validators.required]],
    phongban: ['', [Validators.required]],
    ngaydexuat: ['', [Validators.required]],
    trangthai: ['pending'],
  });


  private OBSERVER_SEARCH_DATA = new Subject<string>();
  notification: any;
  constructor(
    public formBuilder: FormBuilder,
    public yeuCauService: YeuCauService,
    private notificationService: NotificationService,
    public dsCongViecService: DsCongViecService,
    private fileService: FileService,
    private auth: AuthService,
    private router: Router,
    private helperService: HelperService
  ) {
    this.OBSERVER_SEARCH_DATA.asObservable().pipe(distinctUntilChanged(), debounceTime(500)).subscribe(() => this.loadData());
  }

  ngOnInit(): void {
    this.loadData();
    this.getDvPhongBan();
    const isStaffExpert = this.auth.roles.reduce((collector, role) => collector || role === 'dans_lanh_dao', false);
    this.permission.isExpert = isStaffExpert;
    this.permission.canAdd = isStaffExpert;
    this.permission.canEdit = isStaffExpert;
    this.permission.canDelete = isStaffExpert;
  }

  loadData() {
    this.dataSelection = [];
    const filter = this.search ? { search: this.search.trim() } : null;
    this.yeuCauService.list(1, filter).subscribe({
      next: hienThiDSYeuCau => {
        this.data_yeucau = hienThiDSYeuCau;
        this.showStatus(hienThiDSYeuCau);
      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Lỗi không load được nội dung');
      }
    });
  }

  filterRequset(event) {
    // this.OBSERVER_SEARCH_DATA.next(event.value)
  }
  searchData() {
    this.OBSERVER_SEARCH_DATA.next(this.search);
  }

  showStatus(data) {
    data.forEach((f, key) => {
      if (f.trangthai === "pending") {
        f['bg_trangthai'] = 'bg-blue-500';
        f['trangthai_label'] = "Đang chờ duyệt";

      }
      if (f.trangthai === "approved") {
        f['bg_trangthai'] = 'bg-green-500';
        f['trangthai_label'] = "Đã phê duyệt";
      }
      // else{
      //   f['bg_trangthai'] = 'bg-yellow-500';
      //   f['trangthai_label'] = "Đã huỷ";
      // }
    })


  }

  //form gruop 
  onOpenFormEdit() {
    this.notificationService.openSideNavigationMenu({
      template: this.nsFormEdit,
      size: 500,
    })
  }
  btnAdd() {
    this.changeInputMode("add");
    this.onOpenFormEdit();
  }
  btnEdit(object: DanhSachYeuCau) {
    this.changeInputMode('edit', object);
    this.onOpenFormEdit();
  }

  changeInputMode(formType: 'add' | 'edit', object: DanhSachYeuCau | null = null) {
    this.formState.formTitle = formType === 'add' ? 'Thêm yêu cầu' : 'Cập nhật yêu cầu';
    this.formState.formType = formType;
    if (formType === 'add') {
      this.formData.reset(
        {
          // tenproject: '',
          // tongquan: '',
          // date_start: '',
          // date_end: '',
          // phongban: '',
          trangthai: 'pending'
        }
      )
    } else {
      this.formState.object = object;
      object.ngaydexuat = this.helperService.strToSQLDate(object.ngaydexuat)
      this.formData.reset({
        tendexuat: object?.tendexuat,
        nguoidexuat: object?.nguoidexuat,
        phongban: object?.phongban,
        ngaydexuat: object?.ngaydexuat,
        trangthai: 'pending'
      })
    }
  }


  updateForm() {
    if (this.formData.valid) {
      if (this.formState.formType === 'add') {
        this.notificationService.isProcessing(true);
        this.yeuCauService.add(this.formData.value).subscribe({
          next: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastSuccess("thành công");
            this.loadData();
            this.formData.reset(
              {
                // ma_ns: '',
                // nam_congnhan: '',
                // ten_trinhdo_tinhoc: '',
                // loai: '',
                // xeploai: '',
              }
            )
          }, error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastError("Thêm thất bại");
          }
        })
      } else {
        this.notificationService.isProcessing(true);
        const index = this.data_yeucau.findIndex(r => r.id === this.formState.object.id);
        this.formData.value['ngaydexuat'] = this.helperService.strToSQLDate(this.formData.value['ngaydexuat']);
        this.yeuCauService.edit(this.data_yeucau[index].id, this.formData.value).subscribe({
          next: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastSuccess('Cập nhật thành công');
            this.loadData();
            this.closeSide();
          }, error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastError("Cập nhật thất bại thất bại");
          }
        })
      }
    }
    else {
      this.notificationService.toastError("Lỗi nhập liệu");
    }
  }
  closeSide() {
    this.notificationService.closeSideNavigationMenu();
  }
  //item dropdown phongban with database
  getDvPhongBan() {
    this.notificationService.isProcessing(true);
    this.dsCongViecService.getData_Phongban().subscribe({
      next: dsDvPhongBan => {
        this.dmpb = dsDvPhongBan;
        this.notificationService.isProcessing(false)
      }, error: () => {
        this.notificationService.isProcessing(false);
      }
    })
  }
  //phê duyệt theo checkbox checked

  backApprove() {
    if (this.dataSelection.length) {
      const ids = [];
      this.notificationService.isProcessing(true);
      let i = 0;
      this.dataSelection.forEach((f, key) => {
        setTimeout(() => {
          this.yeuCauService.edit(f.id.toString(), { trangthai: 'pending' }).subscribe(() => {
            i = i + 1;
            if (i === this.dataSelection.length) {
              this.notificationService.toastSuccess('Thành công');
              this.loadData();
              this.notificationService.isProcessing(false);
            }

          }, () => {
            i = i + 1;
            if (i === this.dataSelection.length) {
              this.notificationService.toastSuccess('Thành công');
              this.loadData();
              this.notificationService.isProcessing(false);
            }
          })
        }, 50 * key)
      })

    } else {
      this.notificationService.alertInfo("Thông báo", "không có yêu cầu được chọn")
    }
  }

  approve() {
    // let index = this.data_yeucau.filter(r => r.id )

    // this.data_yeucau.findIndex((f,key)=> {
    //   console.log(f.id);
    // })
    // console.log(this.dataSelection[index].id);
    if (this.dataSelection.length) {
      const ids = [];
      this.notificationService.isProcessing(true);
      let i = 0;
      this.dataSelection.forEach((f, key) => {
        setTimeout(() => {
          this.yeuCauService.edit(f.id.toString(), { trangthai: 'approved' }).subscribe(() => {
            i = i + 1;
            if (i === this.dataSelection.length) {
              this.notificationService.toastSuccess('Thành công');
              this.loadData();
              this.notificationService.isProcessing(false);
            }

          },
            () => {
              i = i + 1;
              if (i === this.dataSelection.length) {
                this.notificationService.toastSuccess('Thành công');
                this.loadData();
                this.notificationService.isProcessing(false);
              }
            }
          )
        }, 50 * key)
      })

    } else {
      this.notificationService.alertInfo("Thông báo", "không có yêu cầu được chọn")

    }

  }
}
