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

## Tối ưu hóa computing resource
Trước hết, để tối ưu hóa cho việc convert video thì mình nghĩ kiến thức về xử lý video là không thể thiếu, hay cụ thể hơn là cấu hình câu lệnh ffmpeg như thế nào để việc convert được hiệu quả và tiết kiệm nhất. Mình nói thật là chưa có nhiều kinh nghiệm lắm về mảng này nên xin tạm không đào sâu. Chỉ xin xác định rằng research về video processing là quan trọng và cần thiết.

Thay vào đó, mình xin trình bày ý tưởng tổng quát hơn về hệ thống. Hiện tại, ý tưởng cơ bản về hệ thống convert của mình có thể trình bày như sau:

![enter image description here](https://i.imgur.com/OR1CGRK.png)

Video sau khi được upload lên server thì sẽ được tạo các job tương ứng với việc convert, đưa vào các hàng đợi, và sẽ được xử lý bởi các worker tương ứng. Việc tăng khả năng xử lý của hệ thống, trước hết, có thể được xử lý bằng việc tăng số lượng worker, tư tưởng này khá cơ bắp và có lẽ chưa thực sự tối ưu (~~nhưng ít nhất nó chạy được~~)

1. Ý tưởng đầu tiên để tối ưu của mình đến từ quy trình convert video của FFMPEG:
```
 _______              ______________
|       |            |              |
| input |  demuxer   | encoded data |   decoder
| file  | ---------> | packets      | -----+
|_______|            |______________|      |
                                           v
                                       _________
                                      |         |
                                      | decoded |
                                      | frames  |
                                      |_________|
 ________             ______________       |
|        |           |              |      |
| output | <-------- | encoded data | <----+
| file   |   muxer   | packets      |   encoder
|________|           |______________|
```

Với thiết kế như trên, việc demux demux & decode sẽ bị thực hiện lặp lại cho mỗi định dạng khác nhau. Để tránh việc này, ta cần thêm một bước trung gian để đưa từ input file thành data raw trước khi encode:

![enter image description here](https://i.imgur.com/1C4RW17.png)

**Note**: bên trên vẽ gom lại chỉ có một encode queue, nhưng cần hiểu là có nhiều queue cho mỗi định dạng đầu ra. Suy diễn tương tự, mỗi định dạng đầu vào cũng sẽ cần cấu hình khác nhau cho tối ưu, nên cũng sẽ cần nhiều decode queue với mỗi định dạng đầu vào.

2. Tùy biến bước filter cho từng video:
Việc filter video không chỉ phụ thuộc vào định dạng mà còn phụ thuộc (phần lớn) và bản thân nội dung của video. Cấu hình hiệu quả để convert một video rapid moving (bóng đá, phim, hoạt họa) hoàn toàn khác với một video âm nhạc (tĩnh). Hoặc khác nhau giữa một video dài và một video ngắn. Hoặc một video (gốc) chất lượng cao và chất lượng thấp.

Từ đó dẫn đến việc phân phối xử lý các video ở bước filter cũng là một bài toán cần quan tâm. Đơn cử như các video có tính chất giống nhau, nên được gom chung lại nhằm xử lý bằng một bộ config tối ưu hơn:
![enter image description here](https://i.imgur.com/TcndxUY.png)

Tương tự, filter engine sẽ xác định video sẽ được xử lý bằng cấu hình nào là tối ưu, và đưa vào queue tương ứng. Việc tiêu chí để đánh giá có lẽ cần nghiên cứu chi tiết hơn nữa, mình xin đề xuất vài hướng dễ thấy:
- Bản thân nội dung của video về hình ảnh (tĩnh hay động, mức độ thay đổi hình ảnh) và âm thanh
- Thời lượng (cũng có thể cắt video ra thành nhiều chunk nhỏ để xử lý - cũng không chắc sẽ tối ưu hơn)
- Chất lượng của file gốc (việc convert video thành các định dạng có chất lượng cao hơn khá vô nghĩa)
- Nhu cầu cụ thể của user

3. Tiền xử lý ở client:
Thiết bị cá nhân hiện tại của người dùng hiện nay cũng rất mạnh và có thể xem xét tiền xử lý video trước ở client trước khi gửi lên server.

4. Cơ sở hạ tầng
Bên trên mình chỉ tập trung vào ý tưởng xử lý, nhưng việc xây dựng cơ sở hạ tầng về phần cứng cũng có ảnh hưởng rất lớn đến hiệu năng và không thể bỏ qua. Mình nghĩ việc này nên để lại cho các bạn thiên về System hơn, nên chỉ đề xuất vài gạch đầu dòng cần chú ý:
- Video sau khi upload lên cần được lưu trữ (hoặc đưa về) gần với worker xử lý tương ứng
- Tương tự, output của các giai đoạn cũng cần được lưu trữ sao cho bước xử lý tiếp theo được thực hiện dễ dàng & tối ưu nhất. Giảm chi phí transfer & bandwidth.
- Phân phối kết quả đầu ra cũng cần quan tâm.
- Nếu một queue quá lớn cũng cần tính đến các phương án load balancing
- Việc điều chỉnh số lượng queue / worker có thể rất khác nhau giữa các bước hoặc các định dạng, hoặc thời điểm. Nên cần xây dựng sao cho dễ điều chỉnh tăng / giảm nhất.
- Cuối cùng, việc convert video suy cho cùng là đánh đổi sức mạnh phần cứng, nên hạ tầng phần cứng phải đủ vững chắc.

## Tối ưu hóa trải nghiệm người dùng
Ở đây mình xin copy cách youtube xử lý. Khi người dùng upload một video lên, youtube sẽ cố gắng tạo ra một video theo format chuẩn nhanh nhất có thể mà tạm bỏ qua các tiêu chí về hiệu quả hạ tầng hay chất lượng.
Tương tự thế, ở đây chúng ta có thể làm riêng một queue (và cụm worker) chuyên xử lý fast converting video về một định dạng chất lượng thấp để chuyển sang bước deliver nhanh nhất. Các format chất lượng cao sẽ được xử lý background và cập nhật tự động sau.
Bên cạnh đó, việc tiền xử lý video ở client cũng có thể xem xét (Ví dụ: video dưới 15s có thể tiến hành convert nhanh ở client rồi upload lên server, server có thể sử dụng trực tiếp)
