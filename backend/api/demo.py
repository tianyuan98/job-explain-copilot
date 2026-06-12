from typing import Any
from io import BytesIO
import json as _json
import re

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel
from PyPDF2 import PdfReader

from services.explain_service import (
    generate_appeal_report,
    generate_growth_advice,
    generate_match_explanation,
)
from services.llm_service import chat_sync


router = APIRouter(prefix="/demo", tags=["demo"])


class ExplainRequest(BaseModel):
    scenario_id: str


demo_scenarios: dict[str, dict[str, Any]] = {
    "demo_01": {
        "id": "demo_01",
        "name": "鏉庢槑",
        "profile": {
            "algorithm_rank": "鍓?5%",
            "internship": "2025.06 - 2025.09 鍦ㄨ吘璁鎶€锛堟繁鍦筹級鏈夐檺鍏徃鎷呬换浜戝師鐢熷悗绔紑鍙戝疄涔犵敓锛屼娇鐢?Go 寮€鍙戝鍣ㄥ寲寰湇鍔″苟鍙備笌 Kubernetes 闆嗙兢杩愮淮",
            "system_design_score": 85,
            "career_interest": "鍚庣寮€鍙戙€佷簯鍘熺敓銆佸垎甯冨紡绯荤粺",
        },
        "recommended_job": "浜戣绠楃爺鍙戝伐绋嬪笀",
        "match_score": 87,
        "key_reasons": [
            "绗旇瘯绠楁硶鎴愮哗浣嶅垪鍓?5%锛岄€昏緫鑳藉姏寮?,
            "瀹炰範缁忓巻鐩存帴瑕嗙洊浜戝師鐢熶笌寰湇鍔″紑鍙?,
            "闈㈣瘯涓郴缁熻璁¤兘鍔涜〃鐜扮獊鍑猴紙85鍒嗭級",
        ],
        "alternative_job": "AI 绠楁硶宸ョ▼甯?,
        "alt_match_score": 72,
        "alt_gaps": [
            "缂哄皯鏈哄櫒瀛︿範鐩稿叧椤圭洰缁忓巻",
            "绠€鍘嗕腑鏃犵畻娉曠珵璧涜幏濂栬褰?,
            "娣卞害瀛︿範鐩稿叧璇剧▼鎴愮哗鏈綋鐜?,
        ],
        "appeal_reason": "鎴戣嚜瀛︿簡 PyTorch 骞跺鐜颁簡 ResNet锛屾湭鏉ュ笇鏈涗粠浜?AI 鏂瑰悜",
        "archive": [
            {
                "label": "瀛︽牎",
                "value": "鍖椾含閭數澶у",
                "source": "鏉ヨ嚜绠€鍘?,
                "editable": True,
            },
            {
                "label": "涓撲笟",
                "value": "璁＄畻鏈虹瀛︿笌鎶€鏈?,
                "source": "鏉ヨ嚜绠€鍘?,
                "editable": True,
            },
            {
                "label": "瀛﹀巻",
                "value": "鏈",
                "source": "鏉ヨ嚜绠€鍘?,
                "editable": True,
            },
            {
                "label": "绠楁硶绗旇瘯鎺掑悕",
                "value": "鍓?5%",
                "source": "鏉ヨ嚜绗旇瘯",
                "editable": True,
            },
            {
                "label": "瀹炰範缁忓巻",
                "value": (
                    "鑵捐绉戞妧锛堟繁鍦筹級鏈夐檺鍏徃锛屼簯鍘熺敓鍚庣寮€鍙戝疄涔犵敓锛?025.06 - 2025.09銆?
                    "浣跨敤 Go 璇█寮€鍙戝鍣ㄥ寲寰湇鍔★紝鍙備笌 Kubernetes 闆嗙兢杩愮淮锛?
                    "缂栧啓鑷姩鍖栭儴缃茶剼鏈紝浼樺寲 CI/CD 娴佹按绾裤€?
                ),
                "source": "鏉ヨ嚜绠€鍘?,
                "editable": True,
            },
            {
                "label": "椤圭洰缁忓巻",
                "value": (
                    "\u201c鍒嗗竷寮忕紦瀛樼郴缁焅u201d璇剧▼璁捐锛?024.09 - 2024.12锛夛紝鎶€鏈爤锛欸o + Redis + gRPC锛?
                    "璐熻矗鏍稿績缂撳瓨娣樻卑绛栫暐瀹炵幇锛岄€氳繃 Redis 闆嗙兢瀹炵幇鏁版嵁鍒嗙墖涓庨珮鍙敤銆俓n"
                    "\u201c杞婚噺绾?API 缃戝叧\u201d涓汉椤圭洰锛?025.01 - 2025.04锛夛紝鎶€鏈爤锛欸o + Gin + JWT + Docker锛?
                    "鐙珛瀹屾垚璺敱杞彂銆侀檺娴併€侀壌鏉冩ā鍧楋紝閮ㄧ讲鍦ㄩ樋閲屼簯 ECS锛屽凡閫氳繃姣曚笟璁捐绛旇京銆?
                ),
                "source": "鏉ヨ嚜绠€鍘?,
                "editable": True,
            },
            {
                "label": "璇佷功/琛ュ厖",
                "value": "AWS Solutions Architect Associate 璁よ瘉锛?024.08锛?,
                "source": "鎵嬪姩琛ュ厖",
                "editable": True,
            },
            {
                "label": "鑱屼笟鎰忓悜",
                "value": "鍚庣寮€鍙戙€佷簯鍘熺敓銆佸垎甯冨紡绯荤粺",
                "source": "鏉ヨ嚜蹇楁効",
                "editable": True,
            },
        ],
        "portrait": (
            "绠楁硶鎬濈淮锛氳緝寮猴紙绗旇瘯绠楁硶鎴愮哗浣嶅垪鍓?5%锛岃鏄庨€昏緫鎺ㄧ悊鍜岄棶棰樻媶瑙ｈ兘鍔涜緝绐佸嚭锛塡n"
            "绯荤粺璁捐锛氳緝寮猴紙闈㈣瘯绯荤粺璁捐璇勫垎85鍒嗭紝涓旈」鐩腑娑夊強缂撳瓨鍒嗙墖銆侀珮鍙敤鍜岀綉鍏抽檺娴佽璁★級\n"
            "宸ョ▼瀹炶返锛氳緝寮猴紙鑵捐浜戝師鐢熷悗绔疄涔犺鐩?Go 寰湇鍔°€並ubernetes 杩愮淮鍜?CI/CD 浼樺寲锛塡n"
            "椤圭洰瀹屾暣搴︼細杈冨己锛堝垎甯冨紡缂撳瓨绯荤粺涓庤交閲忕骇 API 缃戝叧鍧囨湁鏄庣‘鎶€鏈爤銆佽亴璐ｅ拰钀藉湴缁撴灉锛塡n"
            "浣犵殑鑱屼笟鎰忓悜锛氬悗绔紑鍙戙€佷簯鍘熺敓銆佸垎甯冨紡绯荤粺锛堟潵鑷織鎰匡紝涓庡疄涔犲拰椤圭洰鏂瑰悜涓€鑷达級\n\n"
            "璇存槑锛氫互涓婃槸鍩轰簬浣犳彁渚涜祫鏂欑殑鍒濇鍒嗘瀽锛屽悗缁矖浣嶆帹鑽愬皢浠ユ涓哄熀纭€銆?
        ),
        "explanation": "浜茬埍鐨勫悓瀛︼紝鎮ㄥソ锛乗n\n鍦ㄤ粩缁嗗垎鏋愪簡鎮ㄧ殑涓汉璧勬枡鍜屽疄涔犵粡鍘嗗悗锛屾垜浠潪甯搁珮鍏村湴鍚戞偍鎺ㄨ崘浜戣绠楃爺鍙戝伐绋嬪笀杩欎釜宀椾綅銆備互涓嬫槸鎴戜滑鎺ㄨ崘杩欎釜宀椾綅鐨勫嚑涓叧閿師鍥狅細\n\n棣栧厛锛屾偍鐨勭瑪璇曠畻娉曟垚缁╀綅鍒楀墠15%锛岃繖鍏呭垎璇佹槑浜嗘偍鍦ㄩ€昏緫鎬濈淮鍜岀畻娉曡璁℃柟闈㈢殑寮哄ぇ鑳藉姏銆備簯璁＄畻棰嗗煙瀵硅繖绫昏兘鍔涙湁鐫€鏋侀珮鐨勯渶姹傦紝鍥犳鎮ㄥ湪杩欎釜宀椾綅涓婄殑琛ㄧ幇灏嗕細闈炲父鍑鸿壊銆俓n\n鍏舵锛屾偍鐨勫疄涔犵粡鍘嗕笌璇ュ矖浣嶇洿鎺ョ浉鍏炽€傚湪鑵捐绉戞妧锛堟繁鍦筹級鏈夐檺鍏徃鐨勫疄涔犳湡闂达紝鎮ㄤ娇鐢℅o璇█寮€鍙戝鍣ㄥ寲寰湇鍔★紝骞跺弬涓庝簡Kubernetes闆嗙兢鐨勮繍缁村伐浣溿€傝繖浜涘疂璐电殑瀹炶返缁忛獙灏嗗府鍔╂偍鏇村揩鍦拌瀺鍏ュ洟闃燂紝骞跺彂鎸ユ偍鐨勪笓涓氭妧鑳姐€俓n\n鏈€鍚庯紝鍦ㄩ潰璇曚腑锛屾偍鐨勭郴缁熻璁¤兘鍔涘緱鍒颁簡85鍒嗙殑楂樿瘎浠凤紝杩欒〃鏄庢偍鍦ㄦ灦鏋勮璁″拰绯荤粺浼樺寲鏂归潰鍏峰鎵庡疄鐨勫熀纭€銆傝繖瀵逛簬浜戣绠楃爺鍙戝伐绋嬪笀杩欎竴宀椾綅鑷冲叧閲嶈銆俓n\n缁间笂鎵€杩帮紝鎴戜滑鐩镐俊鎮ㄦ槸浜戣绠楃爺鍙戝伐绋嬪笀杩欎釜宀椾綅鐨勭悊鎯充汉閫夈€傚綋鐒讹紝鎴戜滑涔熺悊瑙ｆ偍鍙兘瀵瑰叾浠栧矖浣嶄篃鎰熷叴瓒ｏ紝濡傛灉鎮ㄦ兂浜嗚В鏇村鍏充簬鍏朵粬宀椾綅鐨勪俊鎭紝鍙互鐐瑰嚮涓嬫柟鐨勩€愭帰绱㈠叾浠栧矖浣嶃€戙€俓n\n鏈熷緟鎮ㄧ殑鍔犲叆锛屼竴璧峰湪浜戣绠楅鍩熷紑鍚柊鐨勭瘒绔狅紒\n\n濡傞渶浜嗚В涓轰綍鏈帹鑽愬叾浠栧矖浣嶏紝鍙偣鍑讳笅鏂广€愭帰绱㈠叾浠栧矖浣嶃€戙€?,
        "advice": "鎴愰暱寤鸿锛歕n\n1. **鍔犲己鏈哄櫒瀛︿範椤圭洰缁忓巻绉疮**锛歕n   - **寤鸿**锛氱Н鏋佸弬涓庢垨涓诲涓庢満鍣ㄥ涔犵浉鍏崇殑椤圭洰锛屼緥濡傚弬涓庡紑婧愰」鐩€佸唴閮ㄦ妧鏈寫鎴樿禌鎴栬嚜宸卞彂璧峰皬鍨嬬殑鏈哄櫒瀛︿範椤圭洰銆傞€氳繃瀹為檯鎿嶄綔锛屾彁鍗囧湪鏁版嵁棰勫鐞嗐€佺壒寰佸伐绋嬨€佹ā鍨嬮€夋嫨鍜岃皟浼樼瓑鏂归潰鐨勮兘鍔涖€俓n   - **琛屽姩**锛氭姤鍚嶅弬鍔犲湪绾胯绋嬫垨宸ヤ綔鍧婏紝瀛︿範鏈哄櫒瀛︿範妗嗘灦锛堝TensorFlow鎴朠yTorch锛夌殑搴旂敤锛屽苟鍦ㄩ」鐩腑瀹炶返銆俓n\n2. **鎻愬崌绠楁硶绔炶禌鍙備笌搴?*锛歕n   - **寤鸿**锛氭姤鍚嶅弬鍔犵畻娉曠珵璧涳紝濡侹aggle绔炶禌锛岄€氳繃瑙ｅ喅瀹為檯闂鏉ユ彁鍗囩畻娉曡璁¤兘鍔涘拰闂瑙ｅ喅鎶€宸с€傜珵璧涚粡楠屾湁鍔╀簬鍦ㄧ畝鍘嗕腑绐佸嚭浣犵殑鎶€鏈疄鍔涖€俓n   - **琛屽姩**锛氬叧娉ㄧ畻娉曠珵璧涚殑淇℃伅锛屽姣忓懆鐨勭紪绋嬫寫鎴橈紝瀹氭湡鍙傚姞骞惰褰曚綘鐨勬垚缁╁拰缁忛獙銆俓n\n3. **浣撶幇娣卞害瀛︿範璇剧▼鎴愮哗**锛歕n   - **寤鸿**锛氱‘淇濅綘鐨勭畝鍘嗕腑娓呮櫚鍦颁綋鐜颁簡娣卞害瀛︿範鐩稿叧璇剧▼鐨勬垚缁╋紝鐗瑰埆鏄偅浜涗笌AI绠楁硶宸ョ▼甯堝矖浣嶇揣瀵嗙浉鍏崇殑璇剧▼銆傚鏋滄垚缁╀紭寮傦紝鍙互璇︾粏鍒楀嚭璇剧▼鍚嶇О銆佹垚缁╀互鍙婁綘鍦ㄨ绋嬩腑鐨勫叿浣撹础鐚€俓n   - **琛屽姩**锛氭洿鏂扮畝鍘嗭紝灏嗘繁搴﹀涔犵浉鍏宠绋嬬殑鎴愮哗浠ョ獊鍑烘柟寮忓憟鐜帮紝骞剁畝瑕佹弿杩颁綘鍦ㄨ绋嬮」鐩腑鐨勮鑹插拰鍙栧緱鐨勬垚鏋溿€俓n\n寮曞锛歕n\n鑻ユ偍宸茬粡鏍规嵁浠ヤ笂寤鸿閲囧彇浜嗚鍔紝骞舵垚鍔熻ˉ鍏呬簡鏈哄櫒瀛︿範椤圭洰缁忓巻銆佺畻娉曠珵璧涜幏濂栬褰曚互鍙婃繁搴﹀涔犵浉鍏宠绋嬫垚缁╋紝杩欎簺鏉愭枡灏嗘湁鍔╀簬鎻愬崌鎮ㄥ湪AI绠楁硶宸ョ▼甯堝矖浣嶄笂鐨勫尮閰嶅害銆傝纭繚鎵€鏈変俊鎭兘鏄渶鏂板拰鏈€鍑嗙‘鐨勩€備竴鏃﹀畬鎴愯繖浜涜ˉ鍏咃紝鎮ㄥ彲浠ュ彂璧峰矖浣嶅瀹★紝浠ユ湡寰呰幏寰楁柊鐨勬満浼氥€傜鎮ㄦ垚闀块『鍒╋紝鏈熷緟鎮ㄧ殑澶嶅鐢宠锛?,
        "appeal_report": "銆愬鐢熺敵璇夌粨鏋勫寲鎶ュ憡銆慭n\n涓€銆佸鐢熷熀鏈俊鎭痋n- 瀛︾敓濮撳悕锛氭潕鏄嶾n\n浜屻€佸師鎺ㄨ崘宀椾綅淇℃伅\n- 鍘熸帹鑽愬矖浣嶏細浜戣绠楃爺鍙戝伐绋嬪笀\n\n涓夈€佺敵璇夌洰鏍囧矖浣嶄俊鎭痋n- 鐢宠瘔鐩爣宀椾綅锛欰I 绠楁硶宸ョ▼甯圽n\n鍥涖€佽ˉ鍏呰鏄庢憳瑕乗n- 鏉庢槑鍚屽琛ㄧず锛岄€氳繃鑷鎺屾彙浜?PyTorch 骞舵垚鍔熷鐜颁簡 ResNet 妯″瀷锛屽 AI 棰嗗煙鏈夋祿鍘氬叴瓒ｏ紝甯屾湜杞悜 AI 绠楁硶宸ョ▼甯堝矖浣嶃€俓n\n浜斻€佸矖浣嶅尮閰嶅害鍙樺寲\n- 鍘熷矖浣嶅尮閰嶅垎锛?7\n- 鐩爣宀椾綅鍖归厤鍒嗭細72\n\n鍏€佸缓璁甛n- 鐢变簬鏉庢槑鍚屽鍦?AI 棰嗗煙灞曠幇鍑轰竴瀹氱殑鑷鑳藉姏鍜岄」鐩粡楠岋紝浣嗗師鎺ㄨ崘宀椾綅涓庣敵璇夌洰鏍囧矖浣嶇殑鍖归厤鍒嗗瓨鍦ㄤ竴瀹氬樊璺濓紝寤鸿杩涜浠ヤ笅澶勭悊锛歕n  - 寤鸿浜哄伐澶嶅锛氬鏉庢槑鍚屽鐨勬妧鏈兘鍔涘拰瀛︿範鐑儏杩涜鏇存繁鍏ョ殑璇勪及锛屼互纭畾鍏跺湪 AI 绠楁硶宸ョ▼甯堝矖浣嶄笂鐨勯€傚簲鎬у拰娼滃姏銆俓n  - 缁存寔鍘熺粨鏋滐細濡傛灉缁忚繃澶嶅锛岃涓烘潕鏄庡悓瀛﹀湪浜戣绠楃爺鍙戝伐绋嬪笀宀椾綅涓婂叿澶囨洿楂樼殑鍖归厤搴﹀拰鑱屼笟鍙戝睍娼滃姏锛屽垯缁存寔鍘熸帹鑽愬矖浣嶃€俓n\n涓冦€佺粨璇璡n- 鏍规嵁浠ヤ笂鍒嗘瀽锛屽缓璁繘琛屼汉宸ュ瀹′互纭畾鏈€缁堝矖浣嶅垎閰嶃€?,
    },
    "demo_02": {
        "id": "demo_02",
        "name": "鐜嬪┓",
        "profile": {
            "algorithm_rank": "鍓?0%",
            "internship": "2025.03 - 2025.06 鍦ㄥ瓧鑺傝烦鍔ㄦ媴浠诲墠绔紑鍙戝疄涔犵敓锛屽弬涓庢姈闊崇數鍟嗗悗鍙扮鐞嗙郴缁燂紝浣跨敤 React + TypeScript 鎼缓鍟嗗搧绠＄悊妯″潡 UI 缁勪欢搴?,
            "system_design_score": 70,
            "career_interest": "鏁版嵁绉戝銆佹暟鎹垎鏋愶紙浣嗗鍓嶇涔熸湁鍏磋叮锛?,
        },
        "recommended_job": "鍓嶇寮€鍙戝伐绋嬪笀",
        "match_score": 82,
        "key_reasons": [
            "瀹炰範缁忓巻涓庡墠绔矖浣嶉珮搴﹀尮閰?,
            "绗旇瘯涓?HTML/CSS/JS 妯″潡寰楀垎鍓?0%",
            "鑱屼笟闂嵎涓娆″嚭鐜癨u201c鍙鍖朶u201d銆乗u201c浜や簰\u201d鍏抽敭璇?,
        ],
        "alternative_job": "鏁版嵁绉戝宸ョ▼甯?,
        "alt_match_score": 55,
        "alt_gaps": [
            "缂轰箯 Python 鏁版嵁鍒嗘瀽椤圭洰缁忛獙",
            "鏈弬鍔犳暟瀛﹀缓妯℃垨缁熻绫荤珵璧?,
            "绗旇瘯涓?SQL 鑳藉姏鏈綋鐜?,
        ],
        "appeal_reason": "鎴戝湪璇惧瀹屾垚浜嗘暟鎹垎鏋愬笀璁粌钀ワ紝骞舵嬁鍒拌瘉涔︼紝甯屾湜閲嶆柊瀹氬矖",
        "archive": [
            {
                "label": "瀛︽牎",
                "value": "鍗庝腑绉戞妧澶у",
                "source": "鏉ヨ嚜绠€鍘?,
                "editable": True,
            },
            {
                "label": "涓撲笟",
                "value": "杞欢宸ョ▼",
                "source": "鏉ヨ嚜绠€鍘?,
                "editable": True,
            },
            {
                "label": "瀛﹀巻",
                "value": "纭曞＋",
                "source": "鏉ヨ嚜绠€鍘?,
                "editable": True,
            },
            {
                "label": "绠楁硶绗旇瘯鎺掑悕",
                "value": "鍓?0%",
                "source": "鏉ヨ嚜绗旇瘯",
                "editable": True,
            },
            {
                "label": "瀹炰範缁忓巻",
                "value": (
                    "瀛楄妭璺冲姩锛屽墠绔紑鍙戝疄涔犵敓锛?025.03 - 2025.06銆?
                    "鍙備笌鎶栭煶鐢靛晢鍚庡彴绠＄悊绯荤粺鐨勫墠绔紑鍙戯紝浣跨敤 React + TypeScript锛?
                    "璐熻矗鍟嗗搧绠＄悊妯″潡鐨?UI 缁勪欢搴撴惌寤恒€?
                ),
                "source": "鏉ヨ嚜绠€鍘?,
                "editable": True,
            },
            {
                "label": "椤圭洰缁忓巻",
                "value": (
                    "\u201c鏁版嵁鍙鍖栧ぇ灞廫u201d璇剧▼椤圭洰锛?024.10 - 2025.01锛夛紝鎶€鏈爤锛歏ue3 + ECharts + WebSocket锛?
                    "瀹炵幇瀹炴椂鏁版嵁娴佸睍绀猴紝璁捐鍙鐢ㄥ浘琛ㄧ粍浠讹紝鑾峰緱鏍＄骇浼樼椤圭洰銆俓n"
                    "\u201c涓汉鍗氬绯荤粺\u201d寮€婧愰」鐩紙鎸佺画缁存姢锛夛紝鎶€鏈爤锛歂ext.js + TailwindCSS + MDX锛?
                    "鍏ㄦ爤鐙珛寮€鍙戯紝鏀寔鏆楅粦妯″紡涓庡叏鏂囨绱紝GitHub Stars 120+銆?
                ),
                "source": "鏉ヨ嚜绠€鍘?,
                "editable": True,
            },
            {
                "label": "璇佷功/琛ュ厖",
                "value": "璇惧瀹屾垚鏁版嵁鍒嗘瀽甯堣缁冭惀骞跺彇寰楄瘉涔?,
                "source": "鎵嬪姩琛ュ厖",
                "editable": True,
            },
            {
                "label": "鑱屼笟鎰忓悜",
                "value": "鏁版嵁绉戝銆佹暟鎹垎鏋愶紙浣嗗鍓嶇涔熸湁鍏磋叮锛?,
                "source": "鏉ヨ嚜蹇楁効",
                "editable": True,
            },
        ],
        "portrait": (
            "绠楁硶鎬濈淮锛氫腑绛夛紙绠楁硶绗旇瘯鎺掑悕鍓?0%锛屽熀纭€鑳藉姏杈炬爣浣嗕笉灞炰簬绐佸嚭浼樺娍锛塡n"
            "鍓嶇宸ョ▼锛氳緝寮猴紙瀛楄妭璺冲姩鍓嶇瀹炰範瑕嗙洊 React + TypeScript 鍜屽悗鍙扮郴缁熺粍浠跺簱寤鸿锛塡n"
            "浜や簰涓庡彲瑙嗗寲锛氳緝寮猴紙鏁版嵁鍙鍖栧ぇ灞忛」鐩娇鐢?Vue3 + ECharts + WebSocket锛屽苟鑾峰緱鏍＄骇浼樼椤圭洰锛塡n"
            "鏁版嵁鍒嗘瀽鑳藉姏锛氬緟琛ュ厖锛堣亴涓氭剰鍚戝亸鏁版嵁绉戝锛屼絾绠€鍘嗕腑缂哄皯 Python 鏁版嵁鍒嗘瀽銆丼QL 鎴栫粺璁″缓妯＄粡鍘嗭級\n"
            "浣犵殑鑱屼笟鎰忓悜锛氭暟鎹瀛︺€佹暟鎹垎鏋愶紝鍚屾椂瀵瑰墠绔篃鏈夊叴瓒ｏ紙鏉ヨ嚜蹇楁効锛塡n\n"
            "璇存槑锛氫互涓婃槸鍩轰簬浣犳彁渚涜祫鏂欑殑鍒濇鍒嗘瀽锛屽悗缁矖浣嶆帹鑽愬皢浠ユ涓哄熀纭€銆?
        ),
        "explanation": "浜茬埍鐨勫悓瀛︼紝\n\n棣栧厛锛岄潪甯告劅璋綘瀵规垜浠叕鍙哥殑鍏虫敞鍜屽叴瓒ｃ€傜粡杩囩患鍚堣€冭檻浣犵殑涓汉鑳藉姏鍜岃繃寰€缁忓巻锛屾垜浠潪甯告帹鑽愪綘鎷呬换鍓嶇寮€鍙戝伐绋嬪笀杩欎竴宀椾綅銆俓n\n棣栧厛锛屼綘鐨勫疄涔犵粡鍘嗕笌鍓嶇宀椾綅楂樺害鍖归厤銆傚湪瀛楄妭璺冲姩鎷呬换鍓嶇寮€鍙戝疄涔犵敓鐨勭粡鍘嗭紝璁╀綘鍦≧eact鍜孴ypeScript绛夋妧鏈笂绉疮浜嗗疂璐电殑瀹炶返缁忛獙锛岃繖瀵逛簬鍓嶇寮€鍙戝伐绋嬪笀杩欎竴宀椾綅鏉ヨ鑷冲叧閲嶈銆俓n\n鍏舵锛屼綘鍦ㄧ瑪璇曚腑HTML/CSS/JS妯″潡鐨勫緱鍒嗕綅灞呭墠20%锛岃繖鍏呭垎璇佹槑浜嗕綘鍦ㄥ墠绔妧鏈柟闈㈢殑鎵庡疄鍩虹鍜屼紭绉€鑳藉姏銆俓n\n鍐嶈€咃紝鍦ㄨ亴涓氶棶鍗蜂腑锛屼綘澶氭鎻愬埌\"鍙鍖朶"鍜孿"浜や簰\"杩欎袱涓叧閿瘝锛岃繖琛ㄦ槑浣犲鍓嶇寮€鍙戜腑鐨勭敤鎴蜂綋楠屽拰瑙嗚鏁堟灉鏈夌潃娴撳帤鐨勫叴瓒ｏ紝杩欎篃鏄垜浠墠绔紑鍙戝伐绋嬪笀宀椾綅鎵€鐪嬮噸鐨勭壒璐ㄣ€俓n\n褰撶劧锛屾垜浠篃鐞嗚В浣犲鏁版嵁绉戝鍜屾暟鎹垎鏋愰鍩熺殑鍏磋叮锛屽墠绔紑鍙戝伐绋嬪笀杩欎竴宀椾綅鍚屾牱鍙互涓轰綘鍦ㄦ暟鎹彲瑙嗗寲鏂归潰鎻愪緵骞块様鐨勫彂灞曠┖闂淬€俓n\n鏈€鍚庯紝濡傞渶浜嗚В涓轰綍鏈帹鑽愬叾浠栧矖浣嶏紝鍙偣鍑讳笅鏂广€愭帰绱㈠叾浠栧矖浣嶃€戙€俓n\n鏈熷緟浣犵殑鍔犲叆锛屽叡鍚屽紑鍚編濂界殑鑱屼笟鏃呯▼锛乗n\n绁濆ソ锛孿n[鍏徃鍚嶇О]鏍″洯鎷涜仒鍥㈤槦",
        "advice": "鎴愰暱寤鸿锛歕n\n1. **绉疮 Python 鏁版嵁鍒嗘瀽椤圭洰缁忛獙**锛歕n   - **寤鸿**锛氬埄鐢ㄤ笟浣欐椂闂村弬涓庢垨鑷鍙戣捣涓€浜涙暟鎹垎鏋愮浉鍏崇殑椤圭洰銆傚彲浠ヤ粠灏忓瀷鏁版嵁闆嗗紑濮嬶紝閫愭鎻愬崌鑷虫洿澶嶆潅鐨勬暟鎹泦銆傚弬涓庡紑婧愰」鐩篃鏄笉閿欑殑閫夋嫨锛岃繖涓嶄粎鑳芥彁楂樹綘鐨勭紪绋嬭兘鍔涳紝杩樿兘璁╀綘鍦ㄩ」鐩腑瀹為檯搴旂敤Python鏁版嵁鍒嗘瀽銆俓n   - **鍏蜂綋琛屽姩**锛氬姞鍏ユ暟鎹垎鏋愮殑鍦ㄧ嚎璇剧▼锛屽畬鎴愰」鐩姤鍛婏紱鍦℅itHub涓婂鎵惧苟鍙備笌鐩稿叧椤圭洰锛涘埄鐢ㄥ伐鍏峰Pandas銆丯umPy銆丮atplotlib绛夎繘琛屾暟鎹垎鏋愬疄璺点€俓n\n2. **鍙傚姞鏁板寤烘ā鎴栫粺璁＄被绔炶禌**锛歕n   - **寤鸿**锛氭姤鍚嶅弬鍔犳暟瀛﹀缓妯℃垨缁熻绫荤珵璧涳紝杩欎簺绔炶禌閫氬父闇€瑕佺患鍚堣繍鐢ㄦ暟瀛︺€佺粺璁″鍜岀紪绋嬬煡璇嗚В鍐抽棶棰橈紝鑳藉鏈夋晥鎻愬崌浣犵殑鏁版嵁鍒嗘瀽鍜岃В鍐抽棶棰樼殑鑳藉姏銆俓n   - **鍏蜂綋琛屽姩**锛氬叧娉ㄧ浉鍏崇珵璧涗俊鎭紝濡傚叏鍥藉ぇ瀛︾敓鏁板寤烘ā绔炶禌銆佺粺璁″缓妯′笌搴旂敤澶ц禌绛夛紱缁勫缓鍥㈤槦锛岀粌涔犲巻灞婄珵璧涢鐩紱鍦ㄧ珵璧涜繃绋嬩腑涓嶆柇瀛︿範鍜屾敼杩涖€俓n\n3. **鎻愬崌 SQL 鑳藉姏**锛歕n   - **寤鸿**锛氶€氳繃瀹為檯鎿嶄綔鍜屽湪绾胯绋嬫潵鎻愰珮浣犵殑SQL鎶€鑳姐€傚彲浠ラ€氳繃妯℃嫙鏁版嵁搴撶幆澧冭繘琛岀粌涔狅紝鎴栬€呭湪瀹為檯宸ヤ綔涓鎵炬満浼氬簲鐢⊿QL銆俓n   - **鍏蜂綋琛屽姩**锛氬畨瑁匰QL鏁版嵁搴撳MySQL鎴朠ostgreSQL锛岃繘琛屽疄闄呮搷浣滐紱鍙傚姞SQL鍦ㄧ嚎璇剧▼锛屽\"SQL浠庡叆闂ㄥ埌绮鹃€歕"锛涘湪宸ヤ綔涓富鍔ㄦ壙鎷呮暟鎹簱鏌ヨ浠诲姟锛屽寮哄疄鎴樼粡楠屻€俓n\n寮曞锛歕n鑻ユ偍宸茬粡鏍规嵁浠ヤ笂寤鸿閲囧彇浜嗚鍔紝骞跺湪鐩稿叧棰嗗煙鍙栧緱浜嗘樉钁楃殑杩涙锛岃鏁寸悊鐩稿叧椤圭洰缁忛獙銆佺珵璧涙垚鏋滃拰SQL鑳藉姏鐨勮瘉鏄庢潗鏂欍€傚噯澶囧ソ杩欎簺琛ュ厖鏉愭枡鍚庯紝鎮ㄥ彲浠ュ彂璧峰矖浣嶅瀹★紝浠ヨ瘉鏄庢偍宸茬粡缂╁皬浜嗕笌鐩爣宀椾綅鐨勫樊璺濓紝骞跺叿澶囨垚涓轰竴鍚嶆暟鎹瀛﹀伐绋嬪笀鐨勬綔鍔涖€傜鎮ㄦ垚闀块『鍒╋紒",
        "appeal_report": "銆愮粨鏋勫寲鎶ュ憡銆慭n\n---\n\n**瀛︾敓濮撳悕锛?* 鐜嬪┓\n\n**鍘熸帹鑽愬矖浣嶏細** 鍓嶇寮€鍙戝伐绋嬪笀\n\n**鐢宠瘔鐩爣宀椾綅锛?* 鏁版嵁绉戝宸ョ▼甯圽n\n**琛ュ厖璇存槑鎽樿锛?*\n鐜嬪┓鍚屽鎻愬嚭鐢宠瘔锛屽笇鏈涜皟鏁村叾鎺ㄨ崘宀椾綅銆傚ス鍦ㄨ澶栧弬鍔犱簡鏁版嵁鍒嗘瀽甯堣缁冭惀骞惰幏寰椾簡璇佷功锛屼互姝よ瘉鏄庤嚜宸卞鏁版嵁绉戝棰嗗煙鐨勫叴瓒ｅ拰鎶€鑳芥彁鍗囷紝甯屾湜瀛︽牎鑳借€冭檻鍏舵儏鍐碉紝閲嶆柊璇勪及骞舵帹鑽愭暟鎹瀛﹀伐绋嬪笀宀椾綅銆俓n\n**鍖归厤搴﹀彉鍖栵細**\n- 鍘熷矖浣嶅尮閰嶅垎锛?2\n- 鐩爣宀椾綅鍖归厤鍒嗭細55\n\n**缁撹锛?*\n閴翠簬鐜嬪┓鍚屽鎻愪緵鐨勮澶栧涔犲拰璇佷功璇佹槑锛屼互鍙婂師宀椾綅涓庣洰鏍囧矖浣嶇殑鍖归厤鍒嗗樊寮傦紝寤鸿杩涜浜哄伐澶嶅锛屼互鏇村叏闈㈠湴璇勪及濂圭殑鎶€鑳藉拰鍏磋叮涓庣洰鏍囧矖浣嶇殑鍖归厤搴︺€傚瀹＄粨鏋滃皢鏈夊姪浜庣‘瀹氭槸鍚﹁皟鏁存帹鑽愬矖浣嶏紝浠ユ洿濂藉湴婊¤冻瀛︾敓鐨勮亴涓氬彂灞曢渶姹傘€傚缓璁細寤鸿浜哄伐澶嶅銆俓n\n---",
    },
    "demo_03": {
        "id": "demo_03",
        "name": "寮犱紵",
        "profile": {
            "algorithm_rank": "鍚?0%",
            "internship": "2025.07 - 鑷充粖 鍦ㄥ崕涓烘妧鏈湁闄愬叕鍙告媴浠荤‖浠舵祴璇曞疄涔犵敓锛岃礋璐?5G 鍩虹珯灏勯妯″潡鑷姩鍖栨祴璇曡剼鏈紪鍐欏苟杈撳嚭娴嬭瘯鎶ュ憡",
            "system_design_score": 60,
            "career_interest": "浜у搧缁忕悊锛堝纭欢鍏磋叮涓嶅ぇ锛?,
        },
        "recommended_job": "纭欢娴嬭瘯宸ョ▼甯?,
        "match_score": 78,
        "key_reasons": [
            "瀹炰範宀椾綅涓庣‖浠舵祴璇曠洿鎺ュ鍙?,
            "绗旇瘯涓數璺€佷俊鍙风浉鍏抽鐩緱鍒嗚緝楂?,
            "鑱屼笟闂嵎涓嚭鐜癨"纭欢\"銆乗"娴嬭瘯\"棰戞楂?,
        ],
        "alternative_job": "浜у搧缁忕悊",
        "alt_match_score": 40,
        "alt_gaps": [
            "鏃犱骇鍝佺浉鍏冲疄涔犳垨椤圭洰缁忓巻",
            "绗旇瘯涓棤浜у搧鎬濈淮棰樿€冨療",
            "鑱屼笟闂嵎鏈綋鐜颁骇鍝佺粡鐞嗘牳蹇冭兘鍔?,
        ],
        "appeal_reason": "鎴戣嚜瀛︿簡浜у搧缁忕悊鍏ㄥ璇剧▼锛屽苟涓诲杩囨牎鍐?APP 寮€鍙戦」鐩紝闄勪笂浣滃搧闆嗛摼鎺ワ紝甯屾湜杩涘叆浜у搧宀椾綅",
        "archive": [
            {
                "label": "瀛︽牎",
                "value": "瑗垮畨鐢靛瓙绉戞妧澶у",
                "source": "鏉ヨ嚜绠€鍘?,
                "editable": True,
            },
            {
                "label": "涓撲笟",
                "value": "鐢靛瓙淇℃伅宸ョ▼",
                "source": "鏉ヨ嚜绠€鍘?,
                "editable": True,
            },
            {
                "label": "瀛﹀巻",
                "value": "鏈",
                "source": "鏉ヨ嚜绠€鍘?,
                "editable": True,
            },
            {
                "label": "绠楁硶绗旇瘯鎺掑悕",
                "value": "鍚?0%",
                "source": "鏉ヨ嚜绗旇瘯",
                "editable": True,
            },
            {
                "label": "瀹炰範缁忓巻",
                "value": (
                    "鍗庝负鎶€鏈湁闄愬叕鍙革紝纭欢娴嬭瘯瀹炰範鐢燂紝2025.07 - 鑷充粖銆?
                    "璐熻矗 5G 鍩虹珯灏勯妯″潡鐨勮嚜鍔ㄥ寲娴嬭瘯鑴氭湰缂栧啓锛屼娇鐢?Python 涓庡唴閮ㄦ祴璇曟鏋讹紝"
                    "杈撳嚭娴嬭瘯鎶ュ憡銆?
                ),
                "source": "鏉ヨ嚜绠€鍘?,
                "editable": True,
            },
            {
                "label": "椤圭洰缁忓巻",
                "value": (
                    "\u201c鍩轰簬 Arduino 鐨勬櫤鑳藉灞呮帶鍒剁郴缁焅u201d璇捐锛?024.03 - 2024.06锛夛紝鎶€鏈爤锛欰rduino + C++ + MQTT锛?
                    "璐熻矗纭欢閫夊瀷涓庡祵鍏ュ紡寮€鍙戯紝瀹炵幇娓╂箍搴︿紶鎰熷櫒鏁版嵁涓婃姤涓庤繙绋嬫帶鍒躲€俓n"
                    "\u201c鏍″洯浜屾墜浜ゆ槗骞冲彴\u201d灏忕▼搴忥紙2024.09 - 2024.12锛夛紝鎶€鏈爤锛氬井淇″皬绋嬪簭 + 浜戝紑鍙戯紝"
                    "璐熻矗鍓嶇椤甸潰涓庢暟鎹簱璁捐锛岀敤鎴烽噺杈惧埌鏍″唴 500+銆?
                ),
                "source": "鏉ヨ嚜绠€鍘?,
                "editable": True,
            },
            {
                "label": "璇佷功/琛ュ厖",
                "value": "鑷浜у搧缁忕悊璇剧▼锛屼富瀵艰繃鏍″唴 APP 寮€鍙戦」鐩苟鍑嗗浣滃搧闆嗛摼鎺?,
                "source": "鎵嬪姩琛ュ厖",
                "editable": True,
            },
            {
                "label": "鑱屼笟鎰忓悜",
                "value": "浜у搧缁忕悊锛堝纭欢鍏磋叮涓嶅ぇ锛?,
                "source": "鏉ヨ嚜蹇楁効",
                "editable": True,
            },
        ],
        "portrait": (
            "绠楁硶鎬濈淮锛氬緟鎻愬崌锛堢畻娉曠瑪璇曟帓鍚嶅悗30%锛岄€氱敤缂栫▼涓庣畻娉曡兘鍔涗笉鏄綋鍓嶄紭鍔匡級\n"
            "纭欢鍩虹锛氳緝寮猴紙鐢靛瓙淇℃伅宸ョ▼鑳屾櫙锛岀瑪璇曚腑鐢佃矾銆佷俊鍙风浉鍏抽鐩緱鍒嗚緝楂橈級\n"
            "娴嬭瘯瀹炶返锛氳緝寮猴紙鍗庝负 5G 鍩虹珯灏勯妯″潡娴嬭瘯瀹炰範锛屾秹鍙?Python 鑷姩鍖栬剼鏈拰娴嬭瘯鎶ュ憡杈撳嚭锛塡n"
            "浜у搧鑳藉姏锛氬緟琛ュ厖锛堣亴涓氭剰鍚戜负浜у搧缁忕悊锛屼絾绠€鍘嗕腑浜у搧璋冪爺銆侀渶姹傚垎鏋愬拰鍟嗕笟鍖栨寚鏍囩粡楠屼笉瓒筹級\n"
            "浣犵殑鑱屼笟鎰忓悜锛氫骇鍝佺粡鐞嗭紝瀵圭‖浠跺叴瓒ｄ笉澶э紙鏉ヨ嚜蹇楁効锛塡n\n"
            "璇存槑锛氫互涓婃槸鍩轰簬浣犳彁渚涜祫鏂欑殑鍒濇鍒嗘瀽锛屽悗缁矖浣嶆帹鑽愬皢浠ユ涓哄熀纭€銆?
        ),
        "explanation": "浜茬埍鐨勫悓瀛︼紝鎮ㄥソ锛乗n\n棣栧厛锛岄潪甯告劅璋㈡偍瀵规垜浠叕鍙哥殑鍏虫敞鍜岄€夋嫨銆傜粡杩囩患鍚堣瘎浼帮紝鎴戜滑闈炲父楂樺叴鍦板悜鎮ㄦ帹鑽愮‖浠舵祴璇曞伐绋嬪笀杩欎釜宀椾綅銆備互涓嬫槸鎴戜滑鎺ㄨ崘杩欎釜宀椾綅鐨勫嚑涓叧閿師鍥狅細\n\n1. **瀹炰範缁忓巻涓庡矖浣嶅鍙?*锛氭偍鍦ㄥ崕涓烘妧鏈湁闄愬叕鍙哥殑瀹炰範缁忓巻锛屾鏄‖浠舵祴璇曞伐绋嬪笀宀椾綅鐨勭洿鎺ュ鍙ｇ粡楠屻€傛偍鍦ㄥ疄涔犳湡闂磋礋璐?G鍩虹珯灏勯妯″潡鐨勮嚜鍔ㄥ寲娴嬭瘯鑴氭湰缂栧啓鍜屾祴璇曟姤鍛婅緭鍑猴紝杩欎簺缁忓巻鍏呭垎璇佹槑浜嗘偍鍦ㄧ‖浠舵祴璇曢鍩熺殑涓撲笟鑳藉姏鍜屽疄璺垫妧鑳姐€俓n\n2. **绗旇瘯琛ㄧ幇浼樺紓**锛氬湪绗旇瘯鐜妭锛屾偍鍦ㄧ數璺拰淇″彿鐩稿叧棰樼洰涓婄殑寰楀垎杈冮珮锛岃繖鍏呭垎灞曠ず浜嗘偍鍦ㄧ‖浠剁煡璇嗘柟闈㈢殑鎵庡疄鍩虹鍜岃壇濂界殑瀛︿範鐞嗚В鑳藉姏銆俓n\n3. **鑱屼笟鍏磋叮鍖归厤**锛氬湪鎮ㄧ殑鑱屼笟闂嵎涓紝鎴戜滑鍙戠幇\"纭欢\"鍜孿"娴嬭瘯\"杩欎袱涓叧閿瘝鍑虹幇鐨勯娆¤緝楂橈紝杩欒〃鏄庢偍瀵圭‖浠舵祴璇曢鍩熸湁鐫€娴撳帤鐨勫叴瓒ｅ拰鐑儏銆俓n\n褰撶劧锛屾垜浠篃娉ㄦ剰鍒版偍瀵逛骇鍝佺粡鐞嗚繖涓€宀椾綅涔熻〃鐜板嚭涓€瀹氱殑鍏磋叮锛屼絾鑰冭檻鍒版偍鐨勫疄涔犵粡鍘嗐€佺瑪璇曡〃鐜板拰鑱屼笟鍏磋叮锛岀‖浠舵祴璇曞伐绋嬪笀杩欎釜宀椾綅灏嗕负鎮ㄦ彁渚涗竴涓洿濂界殑鍙戝睍骞冲彴锛屽府鍔╂偍鍦ㄦ妧鏈鍩熸繁鑰曠粏浣溿€俓n\n濡傛灉鎮ㄥ鍏朵粬宀椾綅涔熸劅鍏磋叮锛屾垨鑰呮兂浜嗚В鏇村鍏充簬杩欎釜宀椾綅鐨勪俊鎭紝璇风偣鍑讳笅鏂圭殑銆愭帰绱㈠叾浠栧矖浣嶃€戣繘琛屼簡瑙ｃ€俓n\n鏈熷緟鎮ㄧ殑鍔犲叆锛屽叡鍚屽紑鍚簿褰╃殑鑱屼笟鏃呯▼锛乗n\n绁濆ソ锛孿n[鍏徃鍚嶇О]鏍″洯鎷涜仒鍥㈤槦",
        "advice": "鎴愰暱寤鸿锛歕n\n1. **绉疮浜у搧鐩稿叧瀹炰範鎴栭」鐩粡鍘?*\n   - **寤鸿**锛氫富鍔ㄥ鎵句笌浜у搧鐩稿叧鐨勫疄涔犳垨椤圭洰鏈轰細锛屽彲浠ユ槸鏍″洯椤圭洰銆佹牎鍐呯珵璧涙垨鑰呮槸涓庝骇鍝佺粡鐞嗗悎浣滅殑鏈轰細銆傞€氳繃瀹為檯鎿嶄綔锛岀悊瑙ｄ骇鍝佸紑鍙戠殑娴佺▼鍜屼骇鍝佺粡鐞嗙殑瑙掕壊锛岀Н绱疄璺电粡楠屻€俓n   - **琛屽姩姝ラ**锛歕n     - 鏌ユ壘鏍″洯鍐呭鐨勪骇鍝佸紑鍙戝伐浣滃潑銆俓n     - 鍙備笌鏍″唴鐨勫垱鏂板垱涓氶」鐩€俓n     - 涓庢鍦ㄤ粠浜嬩骇鍝佺粡鐞嗙殑鏈嬪弸鍚堜綔锛屽弬涓庨」鐩€俓n\n2. **鎻愬崌绗旇瘯涓殑浜у搧鎬濈淮鑳藉姏**\n   - **寤鸿**锛氬畾鏈熺粌涔犱骇鍝佹€濈淮鐩稿叧鐨勯鐩紝濡傜敤鎴烽渶姹傚垎鏋愩€佷骇鍝佽璁°€佷骇鍝佺瓥鐣ョ瓑銆傚彲浠ラ€氳繃鍦ㄧ嚎璇剧▼銆侀槄璇荤浉鍏充功绫嶆垨鑰呭弬鍔犵浉鍏崇殑鍩硅鏉ユ彁鍗囪繖鏂归潰鐨勮兘鍔涖€俓n   - **琛屽姩姝ラ**锛歕n     - 鍔犲叆浜у搧缁忕悊鐩稿叧鐨勭嚎涓婄ぞ鍖猴紝濡侾MCAFFE銆佷汉浜洪兘鏄骇鍝佺粡鐞嗙瓑銆俓n     - 鍙傚姞浜у搧鎬濈淮鐩稿叧鐨勭綉缁滆绋嬶紝濡傜綉鏄撲簯璇惧爞銆佹厱璇剧綉涓婄殑浜у搧缁忕悊璇剧▼銆俓n     - 瀹氭湡杩涜妯℃嫙绗旇瘯锛屽挨鍏舵槸閽堝浜у搧鎬濈淮棰樼洰鐨勮缁冦€俓n\n3. **寮哄寲鑱屼笟闂嵎涓殑浜у搧缁忕悊鏍稿績鑳藉姏浣撶幇**\n   - **寤鸿**锛氬湪鑱屼笟闂嵎涓紝閫氳繃鍏蜂綋鐨勪緥瀛愭潵灞曠ず浣犵殑浜у搧缁忕悊鏍稿績鑳藉姏锛屽甯傚満娲炲療鍔涖€佺敤鎴峰悓鐞嗗績銆侀」鐩鐞嗚兘鍔涚瓑銆俓n   - **琛屽姩姝ラ**锛歕n     - 鍦ㄤ釜浜虹畝鍘嗗拰宸ヤ綔鎻忚堪涓紝浣跨敤STAR娉曞垯锛圫ituation, Task, Action, Result锛夋潵鎻忚堪浣犵殑缁忓巻銆俓n     - 鍒椾妇鍏蜂綋妗堜緥锛屽\"鍦╔X椤圭洰涓紝鎴戝浣曢€氳繃XX绛栫暐瑙ｅ喅浜哫X闂\"銆俓n     - 涓庝骇鍝佺粡鐞嗚亴浣嶆弿杩颁腑鐨勬牳蹇冭兘鍔涚浉鍖归厤锛岀‘淇濅綘鐨勫洖绛旇兘澶熶綋鐜板嚭杩欎簺鑳藉姏銆俓n\n寮曞瀛︾敓锛歕n鑻ユ偍宸茬粡鎸夌収涓婅堪寤鸿閲囧彇浜嗚鍔紝绉疮浜嗙浉鍏崇粡楠岋紝骞跺湪鑱屼笟闂嵎涓綋鐜颁簡浜у搧缁忕悊鐨勬牳蹇冭兘鍔涳紝閭ｄ箞鎮ㄧ殑鑱屼笟鍙戝睍璺緞宸茬粡鍚戝墠杩堝嚭浜嗕竴澶ф銆傛鏃讹紝鎮ㄥ彲浠ュ彂璧峰矖浣嶅瀹★紝璁╄瘎瀹″洟閲嶆柊璇勪及鎮ㄧ殑鍖归厤搴︺€傜鎮ㄥ湪鑱屼笟鎴愰暱鐨勯亾璺笂鍙栧緱鎴愬姛锛?,
        "appeal_report": "銆愮粨鏋勫寲瀛︾敓鐢宠瘔鎶ュ憡銆慭n\n涓€銆佸鐢熶俊鎭痋n- 瀛︾敓濮撳悕锛氬紶浼焅n\n浜屻€佸師鎺ㄨ崘宀椾綅\n- 鍘熸帹鑽愬矖浣嶏細纭欢娴嬭瘯宸ョ▼甯圽n\n涓夈€佺敵璇夌洰鏍囧矖浣峔n- 鐢宠瘔鐩爣宀椾綅锛氫骇鍝佺粡鐞哱n\n鍥涖€佽ˉ鍏呰鏄庢憳瑕乗n- 瀛︾敓寮犱紵鑷浜嗕骇鍝佺粡鐞嗗叏濂楄绋嬶紝骞朵富瀵艰繃鏍″唴 APP 寮€鍙戦」鐩€備负鏀寔鍏剁敵璇夛紝瀛︾敓鎻愪緵浜嗕綔鍝侀泦閾炬帴锛岃〃杈句簡瀵逛骇鍝佺粡鐞嗗矖浣嶇殑寮虹儓鍏磋叮鍜岀浉搴旇兘鍔涖€俓n\n浜斻€佸尮閰嶅害鍙樺寲\n- 鍘熷矖浣嶅尮閰嶅垎锛?8\n- 鐩爣宀椾綅鍖归厤鍒嗭細40\n\n鍏€佸缓璁甛n- 鐢变簬瀛︾敓寮犱紵鎻愪緵浜嗚嚜瀛︾粡鍘嗗拰椤圭洰缁忛獙浣滀负琛ュ厖锛屼笖鐩爣宀椾綅鍖归厤鍒嗙浉杈冧簬鍘熸帹鑽愬矖浣嶆湁杈冨ぇ宸窛锛屽缓璁繘琛屼汉宸ュ瀹★紝浠ユ洿鍏ㄩ潰鍦拌瘎浼板鐢熺殑鑳藉姏鍜岄€傚簲鎬с€俓n\n涓冦€佺粨璇璡n- 寤鸿浜哄伐澶嶅銆?,
    },
}


@router.get("/scenarios")
def list_demo_scenarios() -> list[dict[str, str]]:
    return [
        {
            "id": scenario["id"],
            "name": scenario["name"],
            "recommended_job": scenario["recommended_job"],
        }
        for scenario in demo_scenarios.values()
    ]


@router.post("/explain")
def explain_demo_scenario(request: ExplainRequest) -> dict[str, Any]:
    scenario = demo_scenarios.get(request.scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Demo scenario not found")

    return {
        "scenario": scenario,
        "archive": scenario["archive"],
        "portrait": scenario["portrait"],
        "explanation": scenario.get("explanation", ""),
        "advice": scenario.get("advice", ""),
        "appeal_report": scenario.get("appeal_report", ""),
    }


PARSE_SYSTEM_PROMPT = (
    "浣犳槸涓€涓簿纭殑绠€鍘嗚В鏋愬姪鎵嬨€傝浠庝互涓嬬畝鍘嗘枃鏈腑鎻愬彇淇℃伅锛?
    "鍙繑鍥炰竴涓狫SON瀵硅薄锛屼笉瑕佸寘鍚换浣曞叾浠栨枃瀛椼€佽В閲婃垨鏍囪銆?
    "JSON蹇呴』鍖呭惈浠ヤ笅瀛楁锛歯ame(濮撳悕), school(瀛︽牎), major(涓撲笟), "
    "degree(瀛﹀巻), internship(瀹炰範缁忓巻), projects(椤圭洰缁忓巻), "
    "certificates(璇佷功), career_interest(鑱屼笟鎰忓悜)銆?
    "濡傛灉鏂囨湰涓壘涓嶅埌鏌愪釜瀛楁锛岃瀛楁鐨勫€艰涓虹┖瀛楃涓瞈"\"锛屼笉瑕佸啓\"鏈瘑鍒玕"銆?
)

FALLBACK_RESULT: dict[str, str] = {
    "name": "",
    "school": "",
    "major": "",
    "degree": "",
    "internship": "",
    "projects": "",
    "certificates": "",
    "career_interest": "",
}


@router.post("/parse_resume")
async def parse_resume(file: UploadFile = File(...)) -> dict[str, Any]:
    """瑙ｆ瀽涓婁紶鐨?PDF 绠€鍘嗭紝璋冪敤鏅鸿氨 API 鎻愬彇缁撴瀯鍖栧瓧娈点€?

    鎵€鏈夐敊璇潎杩斿洖 HTTP 200锛岄€氳繃 JSON 涓殑 error 瀛楁鍖哄垎鎴愯触銆?
    """
    try:
        # ---- 鏂囦欢鏍￠獙 ----
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            return {"error": "invalid_file", "message": "浠呮敮鎸?PDF 鏂囦欢锛岃涓婁紶 .pdf 鏍煎紡鐨勭畝鍘?}

        # ---- 绗竴姝ワ細鎻愬彇鏂囨湰 ----
        try:
            contents = await file.read()
            reader = PdfReader(BytesIO(contents))
            text_parts: list[str] = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            raw_text = "\n".join(text_parts).strip()
        except Exception as exc:
            print(f"[parse_resume] PDF 璇诲彇寮傚父: {exc}", flush=True)
            return {"error": "pdf_read_failed", "message": "PDF 鏂囦欢鏃犳硶璇诲彇锛岃妫€鏌ユ枃浠舵槸鍚﹀畬鏁?}

        print(f"[parse_resume] 鎻愬彇鏂囨湰闀垮害: {len(raw_text)} 瀛楃", flush=True)
        if len(raw_text) < 10:
            print(f"[parse_resume] 鏂囨湰杩囩煭锛岀枒浼兼壂鎻忎欢: '{raw_text[:50]}'", flush=True)
            return {
                "error": "text_extraction_failed",
                "message": "绠€鍘嗗唴瀹规棤娉曡瘑鍒紝璇风‘淇濅笂浼犵殑鏄枃瀛楃増PDF锛屾垨灏濊瘯鎵嬪姩濉啓",
            }

        # ---- 绗簩姝ワ細娓呮礂 & 鎴柇鏂囨湰锛堥槻姝?input_length_too_long锛?---
        # 1) 娓呯悊鎺у埗瀛楃鍜屽浣欑┖鐧?
        sanitized = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', raw_text)
        sanitized = re.sub(r'\n{3,}', '\n\n', sanitized)   # 鍘嬬缉澶氫綑绌鸿
        sanitized = re.sub(r' {3,}', '  ', sanitized)      # 鍘嬬缉澶氫綑绌烘牸
        sanitized = sanitized.strip()

        # 2) 鎴柇鍒?4000 瀛楃锛堢暀瓒?system prompt 鍜?response 鐨勭┖闂达級
        MAX_CHARS = 4000
        if len(sanitized) > MAX_CHARS:
            sanitized = sanitized[:MAX_CHARS]
            print(f"[parse_resume] 鏂囨湰宸叉埅鏂? {len(raw_text)} 鈫?{len(sanitized)} 瀛楃", flush=True)

        # ---- 绗笁姝ワ細璋冪敤鏅鸿氨 API ----
        messages = [
            {"role": "system", "content": PARSE_SYSTEM_PROMPT},
            {"role": "user", "content": sanitized},
        ]

        try:
            llm_response = chat_sync(messages)
            print(f"[parse_resume] LLM 杩斿洖闀垮害: {len(llm_response)} 瀛楃", flush=True)
        except Exception as exc:
            error_detail = str(exc)[:300]
            print(f"[parse_resume] LLM 璋冪敤寮傚父: {error_detail}", flush=True)
            return {"error": "llm_failed", "message": "AI 瑙ｆ瀽鏈嶅姟鏆傛椂涓嶅彲鐢紝璇风◢鍚庨噸璇曟垨鎵嬪姩濉啓", "detail": error_detail}

        # ---- 绗洓姝ワ細瑙ｆ瀽 JSON ----
        cleaned = llm_response.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            cleaned = "\n".join(lines).strip()

        try:
            result = _json.loads(cleaned)
            print(f"[parse_resume] JSON 瑙ｆ瀽鎴愬姛, 瀛楁: {list(result.keys())}", flush=True)
        except _json.JSONDecodeError:
            print(f"[parse_resume] JSON 瑙ｆ瀽澶辫触, LLM 杩斿洖鍓?00瀛? {llm_response[:200]}", flush=True)
            return {"error": "parse_failed", "message": "AI 瑙ｆ瀽鏆傛椂涓嶅彲鐢紝璇风◢鍚庨噸璇曟垨鎵嬪姩濉啓"}

        # ---- 绗簲姝ワ細鏍囧噯鍖栧瓧娈?----
        normalized: dict[str, str] = {}
        for key in FALLBACK_RESULT:
            value = str(result.get(key, "")).strip()
            if value in ("鏈瘑鍒?, "鏈煡", "鏃?, "undefined", "null"):
                value = ""
            normalized[key] = value

        return normalized

    except Exception as exc:
        print(f"[parse_resume] 鏈鏈熷紓甯? {exc}", flush=True)
        return {"error": "server_error", "message": "鏈嶅姟鍣ㄥ唴閮ㄩ敊璇紝璇风◢鍚庨噸璇?}


class PortraitRequest(BaseModel):
    school: str = ""
    major: str = ""
    degree: str = ""
    algorithm_rank: str = ""
    internship: str = ""
    projects: str = ""
    certificates: str = ""
    career_interest: str = ""


PORTRAIT_SYSTEM_PROMPT = (
    "浣犳槸涓€涓牎鍥嫑鑱?AI 鐢诲儚鐢熸垚鍔╂墜銆傝鏍规嵁瀛︾敓鎻愪緵鐨勫熀鏈俊鎭紝"
    "鐢熸垚涓€娈电粨鏋勫寲鐨勮兘鍔涚敾鍍忔憳瑕侊紝鍖呭惈浠ヤ笅缁村害鐨勮瘎浼帮細绠楁硶鎬濈淮銆?
    "绯荤粺璁捐/涓撲笟鍩虹銆佸伐绋嬪疄璺点€侀」鐩畬鏁村害銆佽亴涓氭剰鍚戝尮閰嶅害銆?
    "姣忎釜缁村害鐢ㄤ竴鍙ヨ瘽姒傛嫭锛堝'杈冨己''涓瓑''寰呰ˉ鍏?锛夛紝璇皵瀹㈣涓撲笟銆?
    "鏈€鍚庡姞涓?璇存槑锛氫互涓婃槸鍩轰簬浣犳彁渚涜祫鏂欑殑鍒濇鍒嗘瀽锛屽悗缁矖浣嶆帹鑽愬皢浠ユ涓哄熀纭€銆?"
    "鍙繑鍥炵敾鍍忔枃鏈紝涓嶈浠讳綍棰濆鏍囪鎴?JSON 鍖呰９銆?
)


@router.post("/generate_portrait")
async def generate_portrait(request: PortraitRequest) -> dict[str, str]:
    try:
        field_lines = [
            f"瀛︽牎锛歿request.school or '鏈～鍐?}",
            f"涓撲笟锛歿request.major or '鏈～鍐?}",
            f"瀛﹀巻锛歿request.degree or '鏈～鍐?}",
            f"绠楁硶绗旇瘯鎺掑悕锛歿request.algorithm_rank or '鏈～鍐?}",
            f"瀹炰範缁忓巻锛歿request.internship or '鏈～鍐?}",
            f"椤圭洰缁忓巻锛歿request.projects or '鏈～鍐?}",
            f"璇佷功/琛ュ厖锛歿request.certificates or '鏈～鍐?}",
            f"鑱屼笟鎰忓悜锛歿request.career_interest or '鏈～鍐?}",
        ]
        user_content = "\n".join(field_lines)

        messages = [
            {"role": "system", "content": PORTRAIT_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]

        portrait_text = chat_sync(messages)
        return {"portrait": portrait_text}
    except Exception:
        # Demo 妯″紡鎴栨棤 API 瀵嗛挜鏃惰繑鍥為粯璁ょ敾鍍?
        return {
            "portrait": (
                "绠楁硶鎬濈淮锛氬緟纭锛堢瓑寰呰祫鏂欒ˉ鍏咃級\n"
                "绯荤粺璁捐锛氬緟纭锛堢瓑寰呰祫鏂欒ˉ鍏咃級\n"
                "宸ョ▼瀹炶返锛氬緟纭锛堢瓑寰呰祫鏂欒ˉ鍏咃級\n"
                "椤圭洰瀹屾暣搴︼細寰呯‘璁わ紙绛夊緟璧勬枡琛ュ厖锛塡n"
                "鑱屼笟鎰忓悜锛氬緟纭锛堢瓑寰呰祫鏂欒ˉ鍏咃級\n\n"
                "璇存槑锛氫互涓婃槸鍩轰簬浣犳彁渚涜祫鏂欑殑鍒濇鍒嗘瀽锛屽悗缁矖浣嶆帹鑽愬皢浠ユ涓哄熀纭€銆?
            )
        }


@router.get("/llm_health")
def llm_health() -> dict[str, Any]:
    """LLM 杩炴帴鍋ュ悍妫€鏌ワ細娴嬭瘯鏅鸿氨 API 鏄惁鍙揪"""
    import time as _time
    from services.llm_service import _has_api_key, api_key as _ak, base_url as _bu, model as _md

    if not _has_api_key:
        return {"status": "no_key", "message": "LLM_API_KEY 鏈厤缃?}

    try:
        start = _time.time()
        response = chat_sync([
            {"role": "user", "content": "鍥炲涓€涓瓧锛氬ソ"}
        ])
        elapsed = round((_time.time() - start) * 1000)
        return {
            "status": "ok",
            "model": _md or "(default)",
            "base_url": _bu or "(default)",
            "response": response[:50],
            "latency_ms": elapsed,
        }
    except Exception as exc:
        error_type = type(exc).__name__
        error_msg = str(exc)[:300]
        return {
            "status": "error",
            "model": _md or "(default)",
            "base_url": _bu or "(default)",
            "error_type": error_type,
            "error_message": error_msg,
        }
