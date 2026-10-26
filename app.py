from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'rahasia_remindu_123'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///remindu.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mk = db.Column(db.String(100), nullable=False)
    deadline = db.Column(db.String(50), nullable=False)
    sks = db.Column(db.Float, nullable=False)
    kesulitan = db.Column(db.Float, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        action = request.form.get('action')
        username = request.form.get('username').upper()
        password = request.form.get('password')

        if action == 'register':
            if User.query.filter_by(username=username).first():
                flash('Username sudah terdaftar!', 'danger')
            else:
                hashed_pw = generate_password_hash(password, method='pbkdf2:sha256')
                new_user = User(username=username, password=hashed_pw)
                db.session.add(new_user)
                db.session.commit()
                login_user(new_user)
                return redirect(url_for('index'))
                
        elif action == 'login':
            user = User.query.filter_by(username=username).first()
            if user and check_password_hash(user.password, password):
                login_user(user)
                return redirect(url_for('index'))
            else:
                flash('Username atau password salah!', 'danger')

    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/')
@login_required
def index():
    return render_template('index.html', username=current_user.username)

@app.route('/api/tasks', methods=['GET'])
@login_required
def get_tasks():
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    return jsonify([{"id": t.id, "mk": t.mk, "deadline": t.deadline, "sks": t.sks, "kesulitan": t.kesulitan} for t in tasks])

@app.route('/api/add_task', methods=['POST'])
@login_required
def add_task():
    data = request.json
    new_task = Task(mk=data['mk'], deadline=data['deadline'], sks=data['sks'], kesulitan=data['kesulitan'], user_id=current_user.id)
    db.session.add(new_task)
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/delete_task/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id == current_user.id:
        db.session.delete(task)
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"error": "Unauthorized"}), 403

@app.route('/api/clear_tasks', methods=['DELETE'])
@login_required
def clear_tasks():
    Task.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    return jsonify({"success": True})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
