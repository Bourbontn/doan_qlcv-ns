import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { HelperService } from '@core/services/helper.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { getRoute } from '@env';
import { map, Observable } from 'rxjs';
import { DsCongViec, PhongBan } from '../models/ds-cong-viec';

@Injectable({
  providedIn: 'root'
})
export class DsCongViecService {

  private readonly api = getRoute('congviec-danhsachcongviec/');
	private readonly apidmpb = getRoute('danhmuc-phongban/');

	constructor(
		private http: HttpClient,
		private helperService: HelperService,
		private httpParamsHeplerService: HttpParamsHeplerService
	) { }

	list( tinhtrang : number ,filter?: { search: string }): Observable<DsCongViec[]> {
		let params: HttpParams = new HttpParams();
		if (filter) {
			const conditions: OvicConditionParam[] = [
				{
					conditionName: 'id',
					condition: OvicQueryCondition.like,
					value: '%' + filter.search + '%',
					orWhere:'or'
				},
				{
					conditionName: 'tenproject',
					condition: OvicQueryCondition.like,
					value: '%' + filter.search + '%',
					orWhere:'or'
				},
				{
					conditionName: 'ma_congviec',
					condition: OvicQueryCondition.equal,
					value:filter.search,
					orWhere:'or'
				},
				
			];
			params = this.httpParamsHeplerService.paramsConditionBuilder(conditions);
		}
		return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
	}

	createDanhSach( data : any ) : Observable<any> {
		return this.http.post<Dto>( this.api , data );
	}
	editDanhSach(id: number, data: any) {
		return this.http.put<Dto>(this.api + id.toString(), data);
	}
	deleteDanhSach(id: number): Observable<any> {
		return this.http.delete<Dto>(this.api + id.toString());
	}
	getData_Phongban(): Observable<PhongBan[]> {
		return this.http.get<Dto>(this.apidmpb).pipe(map(res => res.data));
	}
}
