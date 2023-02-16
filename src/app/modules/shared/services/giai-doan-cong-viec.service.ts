import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { HelperService } from '@core/services/helper.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { getRoute } from '@env';
import { map, Observable } from 'rxjs';
import { giaiDoanCongViec } from '../models/giai-doan-cong-viec';

@Injectable({
  providedIn: 'root'
})
export class GiaiDoanCongViecService {

	
	private readonly api = getRoute('congviec-giaidoan/');
	
	constructor(
		private http: HttpClient,
		private helperService: HelperService,
		private httpParamsHeplerService: HttpParamsHeplerService
	) { }

	list( tinhtrang : number ,filter?: { search: string }): Observable<giaiDoanCongViec[]> {
		let params: HttpParams = new HttpParams();
		if (filter) {
			const conditions: OvicConditionParam[] = [
				{
					conditionName: 'id',
					condition: OvicQueryCondition.equal,
					value:filter.search,
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
	
	get_gdByid(id: number): Observable<any> {
		return this.http.get<Dto>(''.concat(this.api + id.toString())).pipe(map(res => res.data))
	}
	create( data : any ) : Observable<any> {
		return this.http.post<Dto>( this.api , data );
	}
	edit(id: number, data: any) {
		return this.http.put<Dto>(this.api + id.toString(), data);
	}
	delete(id: number): Observable<any> {
		return this.http.delete<Dto>(this.api + id.toString());
	}
	getdata_giaidoan(): Observable<giaiDoanCongViec[]> {
		return this.http.get<Dto>(this.api).pipe(map(res => res.data));
	  }
	
}
