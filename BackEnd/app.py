from flask import Flask, request
from flask_cors import CORS


app = Flask(__name__)
CORS(app)



@app.route('/api/scan', methods=['POST'])
def scan_image():
    return {"status": "success", "message": "Door is open!"}


    

if __name__ == '__main__':
    app.run(debug=True, port=5001)