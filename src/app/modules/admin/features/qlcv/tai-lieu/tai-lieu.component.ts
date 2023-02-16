import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-tai-lieu',
  templateUrl: './tai-lieu.component.html',
  styleUrls: ['./tai-lieu.component.css']
})
export class TaiLieuComponent implements OnInit {
  menuitems !: MenuItem[];

  constructor() { }

  ngOnInit(): void {
    this.menuitems = [
      { icon: "pi pi-pencil" , label: 'Edit' },
      { icon: "pi pi-trash" , label: 'Delete' },
      { icon: "pi pi-user-plus" , label: 'Invite' },
      { icon: "pi pi-sign-out" , label: 'Leave' },
  ];
  }

}
