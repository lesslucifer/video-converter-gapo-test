# [Quang Vu] - Gapo Code Challenge

Project này là bài làm cho Code Challenge của công ty Gapo, implement server convert video do người dùng tải lên thành các định dạng cho trước (480p @ 60fps HLS/H.264, 480p @ 30fps HLS/H.264).

Ở đây mình dùng `NodeJS` cho backend.
Convert video dùng FFMPEG (`fluent-ffmpeg`)
Và một frontend đơn giản dùng `ReactJS`

## Khởi động

### Clone project
Trước tiên thì bạn cần clone project này về máy bạn, simple:
```bash
git clone git@github.com:lesslucifer/video-converter-gapo-test.git
```

Để start server, bạn có thể dùng docker hoặc tự chạy bằng dòng lệnh.

---
### Dùng docker
Nếu bạn sử dụng docker, có thể run project này đơn giản bằng lệnh:
```bash
docker-compose up
```

### Chạy manually
Dự án này viết bằng nodejs (typescript), nên bạn cũng có thể chạy trực tiếp từ mã nguồn, bằng các câu lệnh thông thường:

```bash
npm install
npm build
npm run serve
```

Project này dùng một external dependency là `redis`, nên để khởi động server thành công máy bạn cần cài đặt `redis` trước. Nếu bạn cài đặt custom hoặc dùng dịch vụ ngoài thì cần cấu hình lại thông tin kết nối redis trong file `env.json`.

---
Mặc định, server sẽ listen ở port `8080` của máy tính. Có thể chỉnh lại trong file config `env.json`. Sau khi chạy thành công, bạn có thể test trực tiếp gọi API bằng curl:

```bash
curl --location --request GET 'http://localhost:8080/videos'
```

Nếu mọi thứ hoạt động ổn định, bạn sẽ nhận được response như dưới đây:

```json
{
    "success": true,
    "data": []
}
```
Hoặc vào trực tiếp frontend luôn:
http://localhost:8080/videos/upload.html

## Project này có gì
Mình develop project bằng VSCode, nên nếu được bạn nên dùng cùng IDE để explore.

### Cấu trúc thư mục

```
.
├── app.ts
├── .config
├── data
├── glob
├── models
├── routes
├── serv
│ └── workers
├── test
└── utils
```

-  `app.ts`: File đầu vào của project. Khởi động các dịch vụ và server. 
-  `.config`: Chứa các config mặc định của cách dịch vụ cho docker-compose
-  `data`: Để thuận tiện thì mình chứa các file tải lên và convert trong thư mục này, bạn có thể sửa lại trong file `env.json`
-  `glob`: Chứa các giá trị global của project, như là: Hằng số, connection,...
-  `models`: Định nghĩa các model của hệ thống
-  `routes`: Chứa các API Controller
-  `serv`: Chứa các service xử lý blogic
-  `workers`: Chứa code xử lý worker và logic (convert video)
-  `test`: Unit tests (Do giới hạn dự án, chưa viết test gì)
-  `utils`: Các thư viện utilities

## Các chức năng chính

### Upload video

User có thể tải video lên thông qua API `POST /videos`. Video sẽ được lưu lại và đưa vào hàng đợi xử lý convert.

### Quản lý video

User có thể kiểm tra danh sách video đã tải lên hoặc trạng thái của một video (realtime) thông qua các API tương ứng.

### Convert video
Các video do User upload lên sẽ được convert thành 2 định dạng là:
- 480p @ 60fps HLS/H.264
- 480p @ 30fps HLS/H.264

Việc convert video mình sử dụng thư viện FFMPEG. Tuy các cấu hình chi tiết có thể còn chưa tối ưu, nhưng việc thay đổi các config là dễ dàng.

### Serving HLS Video
Việc serving video HLS ở backend có thể được thực hiện bằng nhiều cách. Ở đây mình làm cách đơn giản nhất là serving static file trực tiếp bằng thư viện ExpressJS.

Để play HLS Video ở frontend, mình dùng player của [video.js](https://videojs.com/).

### Frontend
Mình có implement một Frontend đơn giản (1 file HTML) sử dụng ReactJS. Bạn có thể truy cập thông qua link:
http://localhost:8080/videos/upload.html

Dĩ nhiên là file HTML này mình cũng serving trực tiếp bằng ExpressJS.

### Worker

Việc xử lý convert video sẽ được đưa vào 1 message queue và có các worker để xử lý sau đó.
Để thuận tiện, mình sử dụng Redis là Message Broker (thông qua thư viện rsmq). Code đã được thiết kế sẵn để có thể thay đổi MQ một cách dễ dàng.

### Các thư viện khác
Bên cạnh các thư viện npm thì mình có attach một vài lib khác (do mình develop) từ các dự án trước để tiết kiệm thời gian:
- `ajv2`: Một wrap-lib của thư viện [ajv](https://www.npmjs.com/package/ajv), giúp viết json-schema dễ hơn
- `hera`: Một thư viện util chứa các hàm hỗ trợ code (bên cạnh lodash)
- `express-router`: Giúp viết API Controller bên cho ExpressJS bên Typescript dễ và trực quan hơn.


## API Documentation

### Response format

Thông thường, các API sẽ trả về dữ liệu ở dạng JSON theo định dạng sau:
```json
{
	"success": "boolean",
	"err": { // nếu là error
		"message": "Error message, nếu có",
		"code": "Error code, nếu có",
		"params": "Các thông tin chi tiết của error, nếu có",
	},
	"data": "Dữ liệu trả về, nếu có"
}
```

Ngoài ra, HTTP Status Code của response cũng có thể được dùng để xác định trạng thái của kết quả.

__CHÚ Ý__: Ở phần dưới đây chỉ tập trung mô tả dữ liệu trong field `data` của response.

---
#### Upload video:

Upload một video lên hệ thống

_Endpoint_: `POST /videos` 

_Request body_ (Multipart Fromdata) :

-  `video`: (Required) File video cần upload

_Response_:
```json
{
        "id": "Id của video vừa upload",
        "name": "File name",
        "created_at": "Thời gian tạo - Unix time msecs",
        "files": [ // Các file convert
            {
                "codecName": "480p_60fps_hlsh264",
                "path": "Path đến file này",
                "status": "Trạng thái"
            },
            {
                "codecName": "480p_30fps_hlsh264",
                "path": "Path đến file này",
                "status": "Trạng thái"
            }
        ]
    }
```

---

#### Get video list:

_Endpoint_: `GET/videos`

_Response_:
```json
[ // mảng các video trong danh sách
  {
        "id": "Id của video vừa upload",
        "name": "File name",
        "created_at": "Thời gian tạo - Unix time msecs",
        "files": [ // Các file convert
            {
                "codecName": "480p_60fps_hlsh264",
                "path": "Path đến file này",
                "status": "Trạng thái"
            },
            {
                "codecName": "480p_30fps_hlsh264",
                "path": "Path đến file này",
                "status": "Trạng thái"
            }
        ]
    }
]
```

#### Get video by ID:
Lấy thông tin của một video theo ID

_Endpoint_: `GET /videos/:id`

_Response_:
```json
{
        "id": "Id của video vừa upload",
        "name": "File name",
        "created_at": "Thời gian tạo - Unix time msecs",
        "files": [ // Các file convert
            {
                "codecName": "480p_60fps_hlsh264",
                "path": "Path đến file này",
                "status": "Trạng thái"
            },
            {
                "codecName": "480p_30fps_hlsh264",
                "path": "Path đến file này",
                "status": "Trạng thái"
            }
        ]
    }
```
---

## Ghi chú
Một vài ghi chú (chém gió) về cách thức mình xây dựng dự án cũng như lý do mình chọn lựa công nghệ và các ý tưởng phía sau của mình:
### Why only Redis:
Project này mình chỉ dùng một external dep duy nhất là Redis. Vừa làm cả DB và MQ.
Ban đầu thì mình cũng khá băn khoăn vì có rất nhiều lựa chọn về công nghệ cho project. Tuy nhiên với việc DB chỉ lưu trữ mỗi video, còn MQ cũng không có yêu cầu gì đặc biệc (scope nhỏ xíu của một bài test) thì mình quyết định dùng Redis cho cả hai.
Lý do là mình muốn giảm nhẹ sự cồng kềnh trong việc setup project, và miễn nó trình bày đủ và đúng ý tưởng của mình, còn công nghệ thì có thể thay đổi / adapt bất kì lúc nào.
Dĩ nhiên, trong code mình đã xây dựng sẵn để có thể thay đổi sang các công nghệ khác nếu cần (có implement thử một file MQEngine dùng RabbitMQ).

### Worker & Backend & Frontend:
Thực ra những thứ này vốn có thể (và nên?) tách biệt ra thành các project riêng. Nhưng vị phạm vi bài test cũng nhỏ nên mình đặt chung vào một codebase, vì tách ra có vẻ sẽ khó khăn trong việc theo dõi & đọc hiểu hơn.

### Flexiblity & Scalability

Hiện tại thì khi start project, chúng ta chạy chung 1 instance cho cả HTTP Server và Worker, điều này mình làm chủ yếu để dễ dàng test hơn. Trên thực tế, 2 đối tượng này cần được run ở các instance khác nhau (và scale thành run multiple instance). Để thực hiện điều này thì có thể chỉnh đối số `PROCESS` trong file `env.json` để bật tắt các tính năng, hoặc chỉ chạy `http` hoặc chỉ chạy `worker` hoặc cả 2.

Việc điều chỉnh các job worker của tương tự, hiện tại thì mình đang chạy 2 job convert song song (qua 2 queue khác nhau), chả sao vì máy mình khá mạnh. Nhưng trên thực tế việc điều chỉnh & phân phối các job này có thể cần thay phải thay đổi nhiều. Vì thế trong code của tách bạch giữa handler (xử lý convert) và engine (phân phối job), nên việc điều chỉnh sau này là khả thi và không tốn công sức.

Tương tự như trên với việc thay đổi các config của FFMPEG, hoặc thay đổi luôn tool convert.

Đối với scale, mô hình MQ giải quyết vấn đề này khá ổn thỏa bằng việc chạy nhiều instance cho worker và cùng consume vào 1 queue, có chăng là thay đổi công nghệ & cách phân phối để tối ưu khả năng xử lý cũng như giải quyết các vấn đề đụng độ về dữ liệu.

### Unit test
Biết nói sao đây, mình biết là unit test quan trọng, nhưng có vẻ mình hơi over-estimate để cuối cùng không kịp viết test. Đây có thể xem là một điểm yếu của mình. Rút kinh nghiệm.

### Authentication
Project này xử lý mọi thứ hoàn toàn transparent và insecure, mình chủ ý không thêm tính năng liên quan tới việc xác thực vào để tránh cồng kềnh và một phần cũng là giới hạn scope và thời gian của bài test.

### Frontend
Trong đề không nhắc gì về implement frontend, nhưng nói chung API chay thì khá khó mà test tính năng. Nên mình làm 1 frontend đơn giản (chỉ 1 file HTML) bằng ReactJS để thao tác với system.
Vì đơn giản nên nó xấu và cấu trúc cũng không tốt lắm. Chủ yếu là gọn lẹ thôi.

### Serving HLS Video
Trong thực tế việc serving HLS file mình nhường lại cho các bạn SO (nếu là mình có lẽ sẽ dùng RMTP + Nginx)
Ở đây để trình bày ý tưởng thì mình dùng express static. Đơn giản nhưng đủ hiệu quả với bài test.

Ở frontend thì mình dùng thư viện common nhất là [video.js](https://videojs.com/), btw.
