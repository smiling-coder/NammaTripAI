/* Planning data. c = estimated Rs per person per day (stay, food, local travel). Review before each use. */
const DATA_REVIEWED="2026-10";
const CITIES={Bengaluru:[12.9716,77.5946],Mysuru:[12.2958,76.6394],Mangaluru:[12.9141,74.856],Hubballi:[15.3647,75.124],Belagavi:[15.8497,74.4977],Kalaburagi:[17.3297,76.8343]};
const PLACES=[
{n:["Mysuru","ಮೈಸೂರು"],ll:[12.2958,76.6394],t:["heritage","temple"],c:2200,d:2,tip:["The palace is lit up on Sundays and festivals. Try Mysore Pak.","ಭಾನುವಾರ ಮತ್ತು ಹಬ್ಬಗಳಲ್ಲಿ ಅರಮನೆ ದೀಪಗಳಿಂದ ಬೆಳಗುತ್ತದೆ. ಮೈಸೂರು ಪಾಕ್ ಸವಿಯಿರಿ."]},
{n:["Hampi","ಹಂಪಿ"],ll:[15.335,76.46],t:["heritage"],c:1800,d:2,tip:["Ruins of the Vijayanagara capital. Start early to avoid the heat.","ವಿಜಯನಗರ ಸಾಮ್ರಾಜ್ಯದ ಅವಶೇಷಗಳು. ಬಿಸಿಲಿನ ಮುನ್ನ ಬೇಗ ಹೊರಡಿ."]},
{n:["Jog Falls","ಜೋಗ ಜಲಪಾತ"],ll:[14.2294,74.8125],t:["nature"],c:1700,d:1,tip:["Best during and after the monsoon, roughly July to October.","ಮಳೆಗಾಲದಲ್ಲಿ ಮತ್ತು ನಂತರ (ಜುಲೈ–ಅಕ್ಟೋಬರ್) ಅತ್ಯುತ್ತಮ."]},
{n:["Gokarna","ಗೋಕರ್ಣ"],ll:[14.5479,74.3188],t:["coast","temple"],c:1600,d:2,tip:["Temple town with quiet beaches such as Kudle and Om.","ಶಾಂತ ಕಡಲತೀರಗಳಿರುವ ದೇವಾಲಯ ಪಟ್ಟಣ (ಕುಡ್ಲೆ, ಓಂ)."]},
{n:["Coorg (Madikeri)","ಕೊಡಗು (ಮಡಿಕೇರಿ)"],ll:[12.4244,75.7382],t:["nature"],c:2400,d:2,tip:["Coffee estates and waterfalls. Roads can be slippery in rain.","ಕಾಫಿ ತೋಟಗಳು ಮತ್ತು ಜಲಪಾತಗಳು. ಮಳೆಯಲ್ಲಿ ರಸ್ತೆ ಜಾರುತ್ತದೆ."]},
{n:["Chikkamagaluru","ಚಿಕ್ಕಮಗಳೂರು"],ll:[13.3161,75.772],t:["nature"],c:2000,d:2,tip:["Hill trails and coffee country. Mullayanagiri is the highest peak in Karnataka.","ಬೆಟ್ಟದ ಹಾದಿಗಳು, ಕಾಫಿ ನಾಡು. ಮುಳ್ಳಯ್ಯನಗಿರಿ ಕರ್ನಾಟಕದ ಅತಿ ಎತ್ತರದ ಶಿಖರ."]},
{n:["Badami","ಬಾದಾಮಿ"],ll:[15.9149,75.6768],t:["heritage"],c:1500,d:1,tip:["Chalukya cave temples cut into red sandstone.","ಕೆಂಪು ಮರಳುಗಲ್ಲಿನಲ್ಲಿ ಕೆತ್ತಿದ ಚಾಲುಕ್ಯರ ಗುಹಾ ದೇವಾಲಯಗಳು."]},
{n:["Pattadakal","ಪಟ್ಟದಕಲ್ಲು"],ll:[15.9484,75.8161],t:["heritage","temple"],c:1500,d:1,tip:["UNESCO World Heritage temple complex. Combine with Badami.","ಯುನೆಸ್ಕೋ ವಿಶ್ವ ಪಾರಂಪರಿಕ ದೇವಾಲಯ ಸಮೂಹ. ಬಾದಾಮಿಯೊಂದಿಗೆ ನೋಡಿ."]},
{n:["Udupi","ಉಡುಪಿ"],ll:[13.3409,74.7421],t:["temple","coast"],c:1700,d:1,tip:["Sri Krishna Temple and the home of Udupi cuisine. Malpe beach is close.","ಶ್ರೀಕೃಷ್ಣ ದೇವಾಲಯ ಮತ್ತು ಉಡುಪಿ ಊಟ. ಹತ್ತಿರದಲ್ಲಿ ಮಲ್ಪೆ ಕಡಲತೀರ."]},
{n:["Murudeshwar","ಮುರುಡೇಶ್ವರ"],ll:[14.0942,74.4851],t:["temple","coast"],c:1600,d:1,tip:["Giant Shiva statue by the sea. Visit near sunset.","ಸಮುದ್ರ ತೀರದಲ್ಲಿ ಬೃಹತ್ ಶಿವನ ಪ್ರತಿಮೆ. ಸೂರ್ಯಾಸ್ತದ ಹೊತ್ತಿಗೆ ಭೇಟಿ ನೀಡಿ."]},
{n:["Shravanabelagola","ಶ್ರವಣಬೆಳಗೊಳ"],ll:[12.8594,76.4838],t:["temple","heritage"],c:1400,d:1,tip:["Climb Vindhyagiri to see the Gommateshwara monolith.","ವಿಂಧ್ಯಗಿರಿ ಏರಿ ಗೊಮ್ಮಟೇಶ್ವರ ಏಕಶಿಲಾ ಮೂರ್ತಿಯನ್ನು ನೋಡಿ."]},
{n:["Belur","ಬೇಲೂರು"],ll:[13.1657,75.8651],t:["heritage","temple"],c:1500,d:1,tip:["Chennakeshava temple, a masterpiece of Hoysala carving.","ಹೊಯ್ಸಳ ಶಿಲ್ಪಕಲೆಯ ಅದ್ಭುತ ಚೆನ್ನಕೇಶವ ದೇವಾಲಯ."]},
{n:["Halebidu","ಹಳೇಬೀಡು"],ll:[13.2125,75.9954],t:["heritage","temple"],c:1500,d:1,tip:["Hoysaleswara temple. Pair it with Belur on one day.","ಹೊಯ್ಸಳೇಶ್ವರ ದೇವಾಲಯ. ಬೇಲೂರಿನೊಂದಿಗೆ ಒಂದೇ ದಿನ ನೋಡಿ."]},
{n:["Dharmasthala","ಧರ್ಮಸ್ಥಳ"],ll:[12.9615,75.3806],t:["temple"],c:1300,d:1,tip:["Manjunatha temple, known for its free meals for pilgrims.","ಮಂಜುನಾಥ ದೇವಾಲಯ; ಭಕ್ತರಿಗೆ ಉಚಿತ ಅನ್ನದಾನಕ್ಕೆ ಪ್ರಸಿದ್ಧ."]},
{n:["Mangaluru","ಮಂಗಳೂರು"],ll:[12.9141,74.856],t:["coast"],c:1900,d:1,tip:["Coastal city famous for seafood and beaches like Panambur.","ಮೀನಿನ ಊಟ ಮತ್ತು ಪಣಂಬೂರು ಕಡಲತೀರಕ್ಕೆ ಪ್ರಸಿದ್ಧ ಕರಾವಳಿ ನಗರ."]},
{n:["Vijayapura","ವಿಜಯಪುರ"],ll:[16.8302,75.71],t:["heritage"],c:1400,d:1,tip:["Gol Gumbaz has a famous whispering gallery.","ಗೋಳಗುಮ್ಮಟದ ಪ್ರಸಿದ್ಧ ಪಿಸುಮಾತಿನ ಗ್ಯಾಲರಿಯನ್ನು ನೋಡಿ."]},
{n:["Bidar","ಬೀದರ್"],ll:[17.9104,77.5199],t:["heritage"],c:1300,d:1,tip:["Bahmani-era fort and the Mahmud Gawan Madrasa.","ಬಹಮನಿ ಕಾಲದ ಕೋಟೆ ಮತ್ತು ಮಹಮೂದ್ ಗವಾನ್ ಮದರಸಾ."]},
{n:["Nandi Hills","ನಂದಿ ಬೆಟ್ಟ"],ll:[13.3702,77.6835],t:["nature"],c:1200,d:1,tip:["Sunrise spot near Bengaluru. Go early; weekends get crowded.","ಬೆಂಗಳೂರಿನ ಹತ್ತಿರದ ಸೂರ್ಯೋದಯ ತಾಣ. ಬೇಗ ಹೋಗಿ; ವಾರಾಂತ್ಯದಲ್ಲಿ ಜನಸಂದಣಿ."]},
{n:["Dandeli","ದಾಂಡೇಲಿ"],ll:[15.2636,74.6179],t:["nature"],c:2100,d:2,tip:["Forest stays and river activities. Check the season and operators first.","ಕಾಡಿನ ವಾಸ ಮತ್ತು ನದಿ ಚಟುವಟಿಕೆಗಳು. ಮೊದಲು ಋತು ಮತ್ತು ಸಂಘಟಕರನ್ನು ಪರಿಶೀಲಿಸಿ."]},
{n:["Sringeri","ಶೃಂಗೇರಿ"],ll:[13.4178,75.2569],t:["temple","nature"],c:1400,d:1,tip:["Sharada Peetha on the Tunga river, surrounded by forest hills.","ತುಂಗಾ ನದಿ ತೀರದ ಶಾರದಾ ಪೀಠ, ಕಾಡಿನ ಬೆಟ್ಟಗಳ ನಡುವೆ."]}
];
