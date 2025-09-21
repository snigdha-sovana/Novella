from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, IntegerField, TextAreaField, SelectField,BooleanField
from wtforms.validators import DataRequired, Email, Length, EqualTo, NumberRange


class SignupForm(FlaskForm):
    username = StringField("Username", validators=[DataRequired(), Length(min=3, max=80)])
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField(
        "Confirm Password",
        validators=[DataRequired(), EqualTo("password", message="Passwords must match!")],
    )
    submit = SubmitField("Sign Up")


class LoginForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
    remember = BooleanField("Remember Me")
    submit = SubmitField("Login")


class BookForm(FlaskForm):
    title = StringField("Title", validators=[DataRequired()])
    author = StringField("Author", validators=[DataRequired()])
    genre = StringField("Genre")
    tropes = StringField("Tropes (comma separated)")
    pages = IntegerField("Pages", validators=[NumberRange(min=1)])
    chapters = IntegerField("Chapters", validators=[NumberRange(min=1)])
    submit = SubmitField("Add Book")


class ProgressForm(FlaskForm):
    pages_read = IntegerField("Pages Read", validators=[NumberRange(min=0)])
    chapters_read = IntegerField("Chapters Read", validators=[NumberRange(min=0)])
    status = SelectField(
        "Status", choices=[("reading", "Reading"), ("completed", "Completed")]
    )
    submit = SubmitField("Update Progress")


class JournalForm(FlaskForm):
    title = StringField("Title", validators=[DataRequired()])
    content = TextAreaField("Content", validators=[DataRequired(), Length(min=10)])
    submit = SubmitField("Save Journal")


class ReviewForm(FlaskForm):
    rating = SelectField(
        "Rating", choices=[(str(i), str(i)) for i in range(1, 6)], coerce=int
    )
    text = TextAreaField("Review", validators=[DataRequired(), Length(min=10)])
    submit = SubmitField("Submit Review")
