import { HttpClient, HttpParams } from '@angular/common/http';
import { OvicConditionParam, OvicQueryCondition, Dto } from '@core/models/dto';
import { HelperService } from '@core/services/helper.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { getRoute } from '@env';
import { Observable, map } from 'rxjs';
import { DmTrinhdoVanhoa } from './../models/danh_muc';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DmTrinhdoVanhoaService {

  private readonly api = getRoute('danhmuc-trinhdo-vanhoa/');


  constructor(    private http: HttpClient,
    private helperService: HelperService,
    private httpParamsHeplerService: HttpParamsHeplerService) { }

    list(ma_id: number, filter?: { search: string }): Observable<DmTrinhdoVanhoa[]> {
      let params: HttpParams = new HttpParams();
      if (filter) {
        const conditions: OvicConditionParam[] = [
          {
            conditionName: "ten_trinhdo",
            condition: OvicQueryCondition.like,
            value: '%' + filter.search + '%'
          },

        ]
        params = this.httpParamsHeplerService.paramsConditionBuilder(conditions);
      }
      return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
    }

    delete(id: number): Observable<any> {
      return this.http.delete<Dto>(this.api + id.toString());
    }

    edit(id: number, data: any) {
      return this.http.put<Dto>(this.api + id.toString(), data);
    }


    add(data: any): Observable<any> {
      return this.http.post<Dto>(this.api, data);
    }
}
