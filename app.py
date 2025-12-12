from flask import Flask, render_template, send_from_directory, request, redirect, url_for

app = Flask(__name__, static_folder='static', template_folder='templates')

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/add_medicine', methods=['GET', 'POST'])
def add_medicine():
    if request.method == 'POST':
        medicines = request.form
        print("Received medicine data:")
        print(medicines)
        return redirect(url_for('schedule'))
    return render_template("add_medicine.html")

@app.route("/schedule")
def schedule():
    return render_template("schedule.html")

@app.route("/confirmation")
def confirmation():
    return render_template("confirmation.html")

if __name__ == "__main__":
    app.run(debug=True)
