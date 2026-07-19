use reqwest::Client;
use serde::{Deserialize, Serialize};

const DEEPSEEK_URL: &str = "https://api.deepseek.com/chat/completions";
const OPEN_METEO_URL: &str = "https://api.open-meteo.com/v1/forecast";
const NOMINATIM_REVERSE_URL: &str = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_SEARCH_URL: &str = "https://nominatim.openstreetmap.org/search";

#[derive(Serialize)]
struct ChatMessage<'a> {
  role: &'a str,
  content: &'a str,
}

#[derive(Serialize)]
struct ResponseFormat<'a> {
  #[serde(rename = "type")]
  kind: &'a str,
}

#[derive(Serialize)]
struct ChatRequest<'a> {
  model: &'a str,
  messages: Vec<ChatMessage<'a>>,
  stream: bool,
  #[serde(skip_serializing_if = "Option::is_none")]
  max_tokens: Option<u32>,
  #[serde(skip_serializing_if = "Option::is_none")]
  response_format: Option<ResponseFormat<'a>>,
}

#[derive(Deserialize)]
struct ChatResponse {
  choices: Vec<ChatChoice>,
}

#[derive(Deserialize)]
struct ChatChoice {
  message: ChatResponseMessage,
}

#[derive(Deserialize)]
struct ChatResponseMessage {
  content: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct GenerateTripInput {
  prompt: String,
  model: String,
  api_key: String,
  current_trip_json: Option<String>,
}

#[derive(Deserialize)]
struct OpenMeteoResponse {
  current: OpenMeteoCurrent,
}

#[derive(Deserialize)]
struct OpenMeteoCurrent {
  temperature_2m: f64,
  weather_code: u16,
  time: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WeatherSnapshot {
  temperature: f64,
  weather_code: u16,
  observed_at: String,
}

#[derive(Deserialize)]
struct NominatimResponse {
  display_name: Option<String>,
  lat: Option<String>,
  lon: Option<String>,
  address: Option<std::collections::HashMap<String, String>>,
}

#[derive(Deserialize)]
struct NominatimSearchResult {
  name: Option<String>,
  display_name: Option<String>,
  lat: String,
  lon: String,
  category: Option<String>,
  #[serde(rename = "type")]
  kind: Option<String>,
  addresstype: Option<String>,
  importance: Option<f64>,
  osm_type: Option<String>,
  extratags: Option<std::collections::HashMap<String, String>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PlaceMatch {
  name: String,
  display_name: String,
  lat: f64,
  lng: f64,
}

async fn call_deepseek(
  api_key: &str,
  model: &str,
  messages: Vec<ChatMessage<'_>>,
  max_tokens: Option<u32>,
  json_mode: bool,
) -> Result<String, String> {
  let request = ChatRequest {
    model,
    messages,
    stream: false,
    max_tokens,
    response_format: json_mode.then_some(ResponseFormat { kind: "json_object" }),
  };

  let response = Client::new()
    .post(DEEPSEEK_URL)
    .bearer_auth(api_key)
    .json(&request)
    .send()
    .await
    .map_err(|error| format!("无法连接 DeepSeek：{error}"))?;

  let status = response.status();
  if !status.is_success() {
    let detail = response.text().await.unwrap_or_default();
    let concise = detail.chars().take(240).collect::<String>();
    return Err(format!("DeepSeek 返回 {status}：{concise}"));
  }

  let payload: ChatResponse = response
    .json()
    .await
    .map_err(|error| format!("无法解析 DeepSeek 响应：{error}"))?;

  payload
    .choices
    .into_iter()
    .next()
    .and_then(|choice| choice.message.content)
    .filter(|content| !content.trim().is_empty())
    .ok_or_else(|| "DeepSeek 没有返回内容".to_string())
}

#[tauri::command]
async fn test_api_key(api_key: String, model: String) -> Result<String, String> {
  let content = call_deepseek(
    api_key.trim(),
    model.trim(),
    vec![ChatMessage {
      role: "user",
      content: "只回复 OK",
    }],
    Some(16),
    false,
  )
  .await?;
  Ok(content)
}

#[tauri::command]
async fn get_current_weather(lat: f64, lng: f64) -> Result<WeatherSnapshot, String> {
  if !(-90.0..=90.0).contains(&lat) || !(-180.0..=180.0).contains(&lng) {
    return Err("天气坐标无效".to_string());
  }
  let payload: OpenMeteoResponse = Client::new()
    .get(OPEN_METEO_URL)
    .query(&[
      ("latitude", lat.to_string()),
      ("longitude", lng.to_string()),
      ("current", "temperature_2m,weather_code".to_string()),
      ("timezone", "auto".to_string()),
    ])
    .send()
    .await
    .map_err(|error| format!("无法连接天气服务：{error}"))?
    .error_for_status()
    .map_err(|error| format!("天气服务返回错误：{error}"))?
    .json()
    .await
    .map_err(|error| format!("无法解析天气数据：{error}"))?;
  Ok(WeatherSnapshot {
    temperature: payload.current.temperature_2m,
    weather_code: payload.current.weather_code,
    observed_at: payload.current.time,
  })
}

#[tauri::command]
async fn reverse_geocode(lat: f64, lng: f64) -> Result<PlaceMatch, String> {
  if !(-90.0..=90.0).contains(&lat) || !(-180.0..=180.0).contains(&lng) {
    return Err("地点坐标无效".to_string());
  }
  let payload: NominatimResponse = Client::builder()
    .user_agent("TravelCanvas/0.1 (local macOS travel planner)")
    .build()
    .map_err(|error| format!("无法创建地点识别请求：{error}"))?
    .get(NOMINATIM_REVERSE_URL)
    .query(&[
      ("format", "jsonv2".to_string()),
      ("lat", lat.to_string()),
      ("lon", lng.to_string()),
      ("zoom", "10".to_string()),
      ("addressdetails", "1".to_string()),
      ("layer", "address".to_string()),
      ("accept-language", "zh-CN,zh".to_string()),
    ])
    .send()
    .await
    .map_err(|error| format!("无法连接地点识别服务：{error}"))?
    .error_for_status()
    .map_err(|error| format!("地点识别服务返回错误：{error}"))?
    .json()
    .await
    .map_err(|error| format!("无法解析地点信息：{error}"))?;
  let address = payload.address.unwrap_or_default();
  let chinese_city = (address.get("country_code").map(String::as_str) == Some("cn"))
    .then(|| {
      payload.display_name.as_deref().and_then(|value| {
        value
          .split(',')
          .map(str::trim)
          .filter(|part| {
            part.ends_with('市')
              || part.ends_with("自治州")
              || part.ends_with("地区")
              || part.ends_with('盟')
          })
          .next_back()
          .map(str::to_string)
      })
    })
    .flatten();
  let name = chinese_city
    .or_else(|| {
      ["city", "town", "village", "municipality", "county", "state"]
        .iter()
        .find_map(|key| address.get(*key).cloned())
    })
    .or_else(|| {
      payload
        .display_name
        .as_deref()
        .and_then(|value| value.split(',').next())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
    })
    .ok_or_else(|| "未识别到该坐标对应的地点".to_string())?;
  let mut display_parts = vec![name.clone()];
  for key in ["state", "country"] {
    if let Some(part) = address.get(key) {
      if !display_parts.contains(part) {
        display_parts.push(part.clone());
      }
    }
  }
  Ok(PlaceMatch {
    name,
    display_name: display_parts.join(" · "),
    lat: payload.lat.and_then(|value| value.parse().ok()).unwrap_or(lat),
    lng: payload.lon.and_then(|value| value.parse().ok()).unwrap_or(lng),
  })
}

fn selected_map_point(prompt: &str) -> Option<(f64, f64)> {
  let coordinate_text = prompt
    .lines()
    .find(|line| line.contains("WGS-84"))?
    .split('：')
    .next_back()?;
  let mut parts = coordinate_text.split(',').map(str::trim);
  Some((parts.next()?.parse().ok()?, parts.next()?.parse().ok()?))
}

fn distance_km(origin: (f64, f64), target: (f64, f64)) -> f64 {
  let lat_delta = (target.0 - origin.0).to_radians();
  let lng_delta = (target.1 - origin.1).to_radians();
  let a = (lat_delta / 2.0).sin().powi(2)
    + origin.0.to_radians().cos()
      * target.0.to_radians().cos()
      * (lng_delta / 2.0).sin().powi(2);
  6371.0 * 2.0 * a.sqrt().atan2((1.0 - a).sqrt())
}

fn normalized_place_name(value: &str) -> String {
  value
    .chars()
    .filter(|character| character.is_alphanumeric())
    .flat_map(char::to_lowercase)
    .collect()
}

fn search_friendly_place_name(value: &str) -> String {
  let trimmed = value.trim();
  for suffix in ["商业步行街", "风景名胜区", "风景区", "商业街", "步行街", "景区"] {
    if let Some(shortened) = trimmed.strip_suffix(suffix) {
      if !shortened.trim().is_empty() {
        return shortened.trim().to_string();
      }
    }
  }
  trimmed.to_string()
}

fn destination_matches_display(display_name: &str, destination: &str) -> bool {
  let destination = normalized_place_name(destination);
  if destination.is_empty() {
    return true;
  }
  display_name.split(',').map(normalized_place_name).any(|component| {
    if component == destination {
      return true;
    }
    let Some(suffix) = component.strip_prefix(&destination) else {
      return false;
    };
    matches!(
      suffix,
      "市" | "市区" | "区" | "區" | "县" | "縣" | "州" | "省" | "都" | "府" | "地区" | "自治州" | "特别行政区"
    )
  })
}

fn trip_coordinate_anchor(trip: &serde_json::Value) -> Option<(f64, f64)> {
  let mut latitudes = Vec::new();
  let mut longitudes = Vec::new();
  for slot in trip
    .get("days")?
    .as_array()?
    .iter()
    .filter_map(|day| day.get("slots").and_then(serde_json::Value::as_array))
    .flatten()
  {
    let Some(lat) = slot.get("lat").and_then(serde_json::Value::as_f64) else {
      continue;
    };
    let Some(lng) = slot.get("lng").and_then(serde_json::Value::as_f64) else {
      continue;
    };
    if (-90.0..=90.0).contains(&lat) && (-180.0..=180.0).contains(&lng) {
      latitudes.push(lat);
      longitudes.push(lng);
    }
  }
  if latitudes.is_empty() {
    return None;
  }
  latitudes.sort_by(f64::total_cmp);
  longitudes.sort_by(f64::total_cmp);
  let middle = latitudes.len() / 2;
  Some((latitudes[middle], longitudes[middle]))
}

fn place_candidate_score(
  candidate: &NominatimSearchResult,
  requested_name: &str,
  selected: Option<(f64, f64)>,
  destination: &str,
) -> Option<f64> {
  let coordinate = (candidate.lat.parse().ok()?, candidate.lon.parse().ok()?);
  if !destination.is_empty()
    && !candidate
      .display_name
      .as_deref()
      .is_some_and(|display| destination_matches_display(display, destination))
  {
    return None;
  }
  let distance = selected.map(|point| distance_km(point, coordinate));
  if distance.is_some_and(|kilometers| kilometers > 500.0) {
    return None;
  }
  let mut score = match candidate.category.as_deref() {
    Some("tourism") => 120.0,
    Some("historic") => 110.0,
    Some("leisure" | "natural") => 90.0,
    Some("man_made") => 80.0,
    Some("amenity") => 65.0,
    Some("building" | "railway" | "aeroway") => 50.0,
    Some("place") => 10.0,
    Some("highway") => -40.0,
    _ => 20.0,
  };
  score += match candidate.kind.as_deref().or(candidate.addresstype.as_deref()) {
    Some("attraction" | "museum" | "gallery" | "monument" | "memorial") => 45.0,
    Some("pedestrian") => 120.0,
    Some("locality" | "neighbourhood" | "suburb") => -35.0,
    Some("bus_stop" | "platform") => -100.0,
    Some("station" | "stop") if !requested_name.contains('站') => -85.0,
    Some("parking" | "parking_entrance") => -70.0,
    _ => 0.0,
  };
  let requested = normalized_place_name(requested_name);
  let candidate_name = candidate
    .name
    .as_deref()
    .map(normalized_place_name)
    .unwrap_or_default();
  if !requested.is_empty() && candidate_name == requested {
    score += 40.0;
  } else if !requested.is_empty()
    && (candidate_name.contains(&requested) || requested.contains(&candidate_name))
  {
    score += 18.0;
  }
  if let Some(tags) = candidate.extratags.as_ref() {
    if tags.contains_key("wikidata") {
      score += 28.0;
    }
    if tags.contains_key("wikipedia") {
      score += 28.0;
    }
    if matches!(tags.get("man_made").map(String::as_str), Some("pier")) {
      score += 24.0;
    }
  }
  if matches!(candidate.osm_type.as_deref(), Some("way" | "relation")) {
    score += 8.0;
  }
  score += candidate.importance.unwrap_or_default() * 12.0;
  score -= distance.unwrap_or_default().min(250.0) / 25.0;
  Some(score)
}

async fn verify_trip_coordinates(
  trip: &mut serde_json::Value,
  prompt: &str,
) -> Result<usize, String> {
  let destination = trip
    .get("destination")
    .and_then(serde_json::Value::as_str)
    .unwrap_or_default()
    .to_string();
  let selected = selected_map_point(prompt).or_else(|| trip_coordinate_anchor(trip));
  let client = Client::builder()
    .user_agent("TravelCanvas/0.1 (local macOS travel planner)")
    .build()
    .map_err(|error| format!("无法创建地图校验请求：{error}"))?;
  let Some(days) = trip.get_mut("days").and_then(serde_json::Value::as_array_mut) else {
    return Ok(0);
  };
  let mut request_count = 0_usize;
  let mut response_count = 0_usize;
  let mut updated_count = 0_usize;
  for day in days {
    let Some(slots) = day.get_mut("slots").and_then(serde_json::Value::as_array_mut) else {
      continue;
    };
    for slot in slots {
      let Some(name) = slot
        .get("name")
        .and_then(serde_json::Value::as_str)
        .map(str::to_string)
      else {
        continue;
      };
      if request_count > 0 {
        tokio::time::sleep(std::time::Duration::from_millis(1100)).await;
      }
      request_count += 1;
      let query = if destination.is_empty() {
        search_friendly_place_name(&name)
      } else {
        format!("{}, {destination}", search_friendly_place_name(&name))
      };
      let response = client
        .get(NOMINATIM_SEARCH_URL)
        .query(&[
          ("format", "jsonv2"),
          ("q", query.as_str()),
          ("limit", "8"),
          ("addressdetails", "1"),
          ("extratags", "1"),
          ("accept-language", "zh-CN,zh"),
        ])
        .send()
        .await;
      let Ok(response) = response else { continue };
      let Ok(response) = response.error_for_status() else {
        continue;
      };
      let Ok(candidates) = response.json::<Vec<NominatimSearchResult>>().await else {
        continue;
      };
      response_count += 1;
      let matched = candidates.into_iter().max_by(|left, right| {
        let left_score =
          place_candidate_score(left, &name, selected, &destination).unwrap_or(f64::NEG_INFINITY);
        let right_score =
          place_candidate_score(right, &name, selected, &destination).unwrap_or(f64::NEG_INFINITY);
        left_score.total_cmp(&right_score)
      });
      if let Some((lat, lng)) = matched
        .filter(|candidate| {
          place_candidate_score(candidate, &name, selected, &destination).is_some()
        })
        .and_then(|candidate| {
          Some((
            candidate.lat.parse::<f64>().ok()?,
            candidate.lon.parse::<f64>().ok()?,
          ))
        })
      {
        slot["lat"] = serde_json::Value::from(lat);
        slot["lng"] = serde_json::Value::from(lng);
        updated_count += 1;
      }
    }
  }
  if request_count > 0 && response_count == 0 {
    return Err("地图定位服务暂不可用，尚未更新已保存行程".to_string());
  }
  Ok(updated_count)
}

#[tauri::command]
async fn recheck_trip_coordinates(trip_json: String) -> Result<String, String> {
  let mut trip = serde_json::from_str::<serde_json::Value>(&trip_json)
    .map_err(|error| format!("无法读取已保存行程：{error}"))?;
  verify_trip_coordinates(&mut trip, "").await?;
  serde_json::to_string(&trip).map_err(|error| format!("无法保存校准后的地图坐标：{error}"))
}

#[tauri::command]
async fn generate_trip(input: GenerateTripInput) -> Result<String, String> {
  let api_key = input.api_key.trim();
  if api_key.len() < 16 {
    return Err("当前会话尚未配置有效的 DeepSeek API Key".to_string());
  }
  let current = input
    .current_trip_json
    .as_deref()
    .unwrap_or("当前没有已有行程，请从零规划。");
  let user_prompt = format!(
    "用户要求：{}\n\n当前行程（如有）：{}",
    input.prompt.trim(),
    current
  );
  let system_prompt = r#"你是旅行行程规划助手。只输出一个合法 JSON 对象，不要 Markdown。所有坐标必须为 WGS-84。不要声称票价、营业时间或天气是实时信息。
JSON 结构：
{
  "title": "城市与天数",
  "startDate": "YYYY-MM-DD",
  "destination": "城市",
  "summary": "一句话行程气质",
  "preTrip": {"weather":"参考天气与核实提醒","packing":"穿搭","payment":"支付","apps":["App"],"ticketTip":"购票提醒"},
  "reminders": [{"item":"事项","leadDays":7}],
  "tips": ["贴士"],
  "days": [{
    "date":"YYYY-MM-DD","weekday":"周一","theme":"当天主题",
    "slots":[{"period":"morning|noon|evening","name":"地点","time":"09:00–11:00","lat":35.0,"lng":139.0,"review":"一句点评","needsBooking":false,"leadDays":0,"transport":{"mode":"地铁","fare":"参考","duration":"约20分钟"}}],
    "dining":[{"meal":"午餐","place":"餐厅或片区","hours":"请出发前核实","dishes":[{"name":"菜名","price":"参考价"}]}],
    "tips":["当天贴士"]
  }],
  "disclaimer":"所有天气、交通、价格、营业时间和地点信息均为 AI 基于常识生成的参考，可能不准确或过时，请在官方渠道和地图 App 核实后再决定。"
}
如果用户提供地图选点坐标，该坐标是地点真值：destination 必须与坐标所在地一致，全部景点坐标必须位于该城市或合理周边，不得沿用示例城市或无关地点。每个 slot 的 name 必须使用可在地图中精确搜索的正式景点或地点名称，避免“老城漫步”“当地街区”等模糊名称。如果用户要求修改已有行程，返回修改后的完整对象。每天安排 3 个时段，路线应尽量顺路并保留缓冲。"#;

  let raw = call_deepseek(
    api_key,
    input.model.trim(),
    vec![
      ChatMessage {
        role: "system",
        content: system_prompt,
      },
      ChatMessage {
        role: "user",
        content: &user_prompt,
      },
    ],
    None,
    true,
  )
  .await?;

  let cleaned = raw
    .trim()
    .trim_start_matches("```json")
    .trim_start_matches("```")
    .trim_end_matches("```")
    .trim();
  let mut trip = serde_json::from_str::<serde_json::Value>(cleaned)
    .map_err(|error| format!("AI 返回的行程不是合法 JSON：{error}"))?;
  verify_trip_coordinates(&mut trip, input.prompt.trim()).await?;
  serde_json::to_string(&trip).map_err(|error| format!("无法整理地图坐标：{error}"))
}

#[cfg(test)]
mod tests {
  use super::*;

  fn candidate(
    category: &str,
    kind: &str,
    lat: &str,
    lng: &str,
    extratags: Option<std::collections::HashMap<String, String>>,
  ) -> NominatimSearchResult {
    NominatimSearchResult {
      name: Some("栈桥".to_string()),
      display_name: Some("栈桥, 市南区, 青岛市, 山东省, 中国".to_string()),
      lat: lat.to_string(),
      lon: lng.to_string(),
      category: Some(category.to_string()),
      kind: Some(kind.to_string()),
      addresstype: Some(kind.to_string()),
      importance: Some(0.01),
      osm_type: Some("way".to_string()),
      extratags,
    }
  }

  #[test]
  fn tourism_landmark_beats_same_name_locality_and_bus_stop() {
    let selected = Some((36.0671, 120.3826));
    let locality = candidate("place", "locality", "36.0619734", "120.3143809", None);
    let bus_stop = candidate("highway", "bus_stop", "36.0617822", "120.3179805", None);
    let landmark = candidate(
      "tourism",
      "tourism",
      "36.0606362",
      "120.3146112",
      Some(std::collections::HashMap::from([
        ("man_made".to_string(), "pier".to_string()),
        ("wikidata".to_string(), "Q8070114".to_string()),
        ("wikipedia".to_string(), "zh:青岛栈桥".to_string()),
      ])),
    );
    let landmark_score = place_candidate_score(&landmark, "栈桥", selected, "青岛").unwrap();
    assert!(
      landmark_score > place_candidate_score(&locality, "栈桥", selected, "青岛").unwrap()
    );
    assert!(
      landmark_score > place_candidate_score(&bus_stop, "栈桥", selected, "青岛").unwrap()
    );
  }

  #[test]
  fn commercial_street_suffix_is_removed_for_map_search() {
    assert_eq!(search_friendly_place_name("中山路商业街"), "中山路");
    assert_eq!(search_friendly_place_name("栈桥景区"), "栈桥");
  }

  #[test]
  fn same_name_candidate_from_another_city_is_rejected() {
    let mut shanghai = candidate("man_made", "works", "31.0345649", "121.2778301", None);
    shanghai.name = Some("青岛啤酒松江公司".to_string());
    shanghai.display_name = Some("青岛啤酒松江公司, 松江区, 上海市, 中国".to_string());
    assert!(place_candidate_score(&shanghai, "中山路商业街", None, "青岛").is_none());
  }

  #[test]
  fn trip_anchor_uses_median_and_ignores_one_remote_marker() {
    let trip = serde_json::json!({
      "days": [{"slots": [
        {"lat": 36.0606, "lng": 120.3146},
        {"lat": 36.0660, "lng": 120.3136},
        {"lat": 31.0345, "lng": 121.2778}
      ]}]
    });
    assert_eq!(trip_coordinate_anchor(&trip), Some((36.0606, 120.3146)));
  }

  #[test]
  fn selected_map_point_is_parsed_from_trip_prompt() {
    assert_eq!(
      selected_map_point("用户地图选点坐标（WGS-84）：36.067100, 120.382600"),
      Some((36.0671, 120.3826))
    );
  }

  #[tokio::test]
  #[ignore = "calls the live OpenStreetMap Nominatim service"]
  async fn live_recheck_moves_zhanqiao_to_the_tourism_landmark() {
    let mut trip = serde_json::json!({
      "destination": "青岛",
      "days": [{"slots": [{
        "name": "栈桥",
        "lat": 36.0619734,
        "lng": 120.3143809
      }]}]
    });
    assert_eq!(verify_trip_coordinates(&mut trip, "").await.unwrap(), 1);
    let slot = &trip["days"][0]["slots"][0];
    assert!((slot["lat"].as_f64().unwrap() - 36.0606362).abs() < 0.0002);
    assert!((slot["lng"].as_f64().unwrap() - 120.3146112).abs() < 0.0002);
  }

  #[tokio::test]
  #[ignore = "calls the live OpenStreetMap Nominatim service"]
  async fn live_recheck_keeps_zhongshan_commercial_street_in_qingdao() {
    let mut trip = serde_json::json!({
      "destination": "青岛",
      "days": [{"slots": [
        {"name": "栈桥", "lat": 36.0606362, "lng": 120.3146112},
        {"name": "中山路商业街", "lat": 31.0345649, "lng": 121.2778301},
        {"name": "青岛啤酒博物馆", "lat": 36.087884, "lng": 120.336423}
      ]}]
    });
    assert_eq!(verify_trip_coordinates(&mut trip, "").await.unwrap(), 3);
    let slot = &trip["days"][0]["slots"][1];
    assert!((36.063..36.067).contains(&slot["lat"].as_f64().unwrap()));
    assert!((120.313..120.315).contains(&slot["lng"].as_f64().unwrap()));
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      test_api_key,
      get_current_weather,
      reverse_geocode,
      recheck_trip_coordinates,
      generate_trip
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
